---
title: K8s에서 MySQL 백업 다시 짜기 — rsync에서 CronJob+mysqldump로
slug: mysql-backup-k8s
category: study/infra/kubernetes
tags: [Kubernetes, k3s, MySQL, mysqldump, CronJob, Backup, DevOps, 인프라, 데이터베이스]
author: Seobway
readTime: 14
featured: false
createdAt: 2026-04-06
excerpt: >
  백업 크론은 돌고 있었다. 그런데 실제로 백업이 되고 있었을까. rsync 기반 물리 백업에서
  K8s CronJob+mysqldump 논리 백업으로 전환한 과정과 이유를 정리한다.
---

백업이 있다고 안심하다가 정작 복구할 때 안 된다는 걸 알게 되는 게 최악의 시나리오다.

우리 서버에도 백업 스크립트가 있었다. 매일 새벽 3시에 크론이 돌았고, 로그에는 "백업 완료"가 찍혔다. 그런데 막상 뜯어보니 문제가 한두 가지가 아니었다.

---

## V1: 있었지만 믿을 수 없었던 백업

기존 스크립트는 `/home/ops/backup/container/rsync_backup.sh`였다. 노드 crontab에 등록되어 있었고, 새벽 3시에 자동 실행됐다.

```bash
0 3 * * * /home/ops/backup/container/rsync_backup.sh
```

스크립트가 백업하는 항목:
- uploads 디렉터리
- Grafana / Loki / Prometheus 볼륨
- **MySQL 데이터 디렉터리 (ibdata, ibd 등 물리 파일)**

여기서 첫 번째 문제가 보인다. MySQL을 **물리 백업**으로 처리하고 있었다.

### 문제 1: 실행 중 물리 백업의 위험

MySQL이 돌고 있는 상태에서 데이터 디렉터리를 rsync로 복사하면, 복사 도중에도 MySQL이 파일을 계속 변경한다. 결과물은 특정 시점의 일관된 스냅샷이 아니다.

스크립트 주석에도 "MySQL (컨테이너 중지 후 권장)"이라고 적혀 있었다. 알고 있었지만 중지하지 않고 돌리고 있었다는 뜻이다. 이 상태의 덤프로 복구하면 InnoDB 내부 불일치로 복구 자체가 실패할 수 있다.<a href="https://dev.mysql.com/doc/refman/8.0/en/backup-types.html" target="_blank"><sup>[1]</sup></a>

### 문제 2: 실패가 가려지는 구조

대상 경로(`/mnt/backup/prod-server/...`)가 존재하지 않으면 rsync가 `mkdir ... failed: No such file or directory` 오류를 냈다. 그런데 스크립트는 오류 여부를 확인하지 않고 마지막에 무조건 "백업 완료"를 로그에 남겼다.

```bash
# 실제 스크립트의 구조 (의사 코드)
rsync -av /source/ /mnt/backup/prod-server/  # 실패해도
echo "백업 완료 $(date)"                          # 항상 출력
```

새벽 3시 로그를 아침에 확인하면 항상 성공처럼 보였다.

### 문제 3: 운영 DB를 백업하는 건지 불명확

`app-prod` 네임스페이스에는 MySQL Pod가 없었다. MySQL은 다른 스택(`legacy-web-stack`)에서 운영됐고, 스크립트는 그 스택의 볼륨 경로를 백업했다. 과연 이 백업이 운영 DB를 백업하는 것인지 확인할 방법이 없었다.

---

## 무엇이 달라야 하는가

정리하면 세 가지가 필요했다.

1. **논리 백업(mysqldump)으로 전환** — 실행 중에도 일관된 덤프 가능
2. **실패가 실패로 기록되는 구조** — exit code 기반 성공/실패 판단
3. **백업 대상이 명확해야 함** — 어떤 DB를 백업하는지 코드에 드러나야 함

그리고 K8s 환경이면 노드 crontab보다 **K8s CronJob**이 자연스럽다. 클러스터 안에서 관리되고, kubectl로 상태를 확인할 수 있고, Secret을 통해 DB 접속정보를 주입할 수 있다.

---

## V2: K8s CronJob + mysqldump

### 핵심 아이디어: Secret에서 접속정보 읽기

DB 비밀번호를 스크립트에 하드코딩하지 않는다. 이미 `app-db-secrets`라는 Secret이 있고, 거기에 `DATABASE_URL`이 들어 있었다.

```
DATABASE_URL=mysql://user:password@host:3306/dbname
```

CronJob에서 `envFrom.secretRef`로 이 Secret을 주입하고, 컨테이너 안에서 URL을 파싱해 mysqldump에 넘긴다.

### 저장 경로 준비

```bash
sudo mkdir -p /data/app/mysql-dumps
sudo chmod 700 /data/app/mysql-dumps
```

CronJob에서 이 경로를 `hostPath`로 마운트한다. `/backup`으로 매핑한다.

### CronJob 매니페스트

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mysql-dump
  namespace: app-prod
spec:
  schedule: "0 3 * * *"         # 매일 새벽 3시
  concurrencyPolicy: Forbid      # 이전 job이 안 끝나면 새 job 생성 안 함
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: mysqldump
              image: mysql:8.0
              envFrom:
                - secretRef:
                    name: app-db-secrets   # DATABASE_URL 주입
              volumeMounts:
                - name: backup-volume
                  mountPath: /backup
              command:
                - /bin/bash
                - -c
                - |
                  set -euo pipefail

                  # DATABASE_URL 파싱
                  # 형식: mysql://user:password@host:port/dbname
                  DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
                  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
                  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
                  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
                  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')

                  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
                  OUTPUT="/backup/${DB_NAME}_${TIMESTAMP}.sql.gz"

                  echo "[$(date)] 백업 시작: $DB_NAME → $OUTPUT"

                  mysqldump \
                    -h "$DB_HOST" \
                    -P "$DB_PORT" \
                    -u "$DB_USER" \
                    -p"$DB_PASS" \
                    --no-tablespaces \
                    --single-transaction \
                    --routines \
                    "$DB_NAME" \
                    | gzip > "$OUTPUT"

                  echo "[$(date)] 백업 완료: $(du -sh "$OUTPUT")"

                  # 보관 정책: 14일 초과 파일 삭제
                  find /backup -name '*.sql.gz' -mtime +14 -delete
                  echo "[$(date)] 보관 정책 적용 완료 (14일 초과 삭제)"
          volumes:
            - name: backup-volume
              hostPath:
                path: /data/app/mysql-dumps
                type: DirectoryOrCreate
```

### mysqldump 옵션 선택 이유

```bash
--single-transaction   # InnoDB: 트랜잭션으로 일관된 스냅샷 (테이블 잠금 없음)
--no-tablespaces       # PROCESS 권한 없어도 실행 가능
--routines             # 저장 프로시저/함수 포함
```

`--single-transaction`이 핵심이다. InnoDB 테이블에서 `BEGIN TRANSACTION` → 덤프 → `COMMIT` 순으로 동작해, 다른 트랜잭션이 커밋되더라도 일관된 시점의 데이터를 읽는다.<a href="https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html" target="_blank"><sup>[2]</sup></a> 서비스를 중단하지 않아도 된다.

`--no-tablespaces`는 초기에 `PROCESS privilege` 오류가 발생해서 추가했다. 권한을 올리는 대신 옵션으로 해결했다.

---

## CronJob 적용 및 확인

```bash
kubectl apply -f /root/mysql-dump-cronjob.yaml -n app-prod
kubectl get cronjob -n app-prod mysql-dump
```

스케줄이 돌기 전에 수동으로 1회 실행해서 즉시 검증할 수 있다.

```bash
# 수동 실행
kubectl -n app-prod delete job mysql-dump-manual --ignore-not-found
kubectl -n app-prod create job --from=cronjob/mysql-dump mysql-dump-manual

# 완료 대기
kubectl -n app-prod wait \
  --for=condition=complete job/mysql-dump-manual \
  --timeout=600s

# 로그 확인
kubectl -n app-prod logs job/mysql-dump-manual --tail=200
```

로그에서 아래를 확인한다:

```
[2026-04-06 03:00:12] 백업 시작: app_db → /backup/app_db_20260406_030012.sql.gz
[2026-04-06 03:00:45] 백업 완료: 48M /backup/app_db_20260406_030012.sql.gz
[2026-04-06 03:00:45] 보관 정책 적용 완료 (14일 초과 삭제)
```

### 덤프 파일 내용 직접 확인

```bash
# 노드에서
ls -la /data/app/mysql-dumps | tail
du -sh /data/app/mysql-dumps

# 파일 내용 앞부분 (mysqldump 헤더와 버전 정보)
zcat /data/app/mysql-dumps/app_db_20260406_030012.sql.gz | head -n 40

# CREATE TABLE 목록
zcat /data/app/mysql-dumps/app_db_20260406_030012.sql.gz | grep -n "CREATE TABLE"
```

헤더에 `mysqldump`로 시작하고, CREATE TABLE 문들이 나오면 덤프가 정상이다.

---

## V1 vs V2 비교

| 항목 | V1 (rsync) | V2 (CronJob+mysqldump) |
|------|-----------|----------------------|
| 백업 방식 | 물리 파일 복사 | 논리 덤프 (SQL) |
| 실행 중 일관성 | 보장 안 됨 | `--single-transaction`으로 보장 |
| 실패 감지 | 실패해도 "완료" 출력 | `set -euo pipefail`, exit code 기반 |
| 접속정보 위치 | 스크립트 내 하드코딩 | K8s Secret 주입 |
| 관리 위치 | 노드 crontab | K8s CronJob (kubectl로 관리) |
| 보관 정책 | 없음 | 14일 자동 삭제 |

---

## 그래서 진짜 백업인가

파일이 생겼다고 백업이 완성된 게 아니다. **복구가 되어야 백업이다.**

다음 글에서는 이 덤프 파일을 실제로 K3s 클러스터 안에 임시 MySQL Pod를 띄워 import하고, 테이블이 정상인지 확인하는 과정을 다룬다. [`백업의 증명 — K3s에서 mysqldump 복구 테스트 →`](/post/mysql-restore-test)

---

## 참고

<ol>
<li><a href="https://dev.mysql.com/doc/refman/8.0/en/backup-types.html" target="_blank">[1] Backup and Recovery Types — MySQL Documentation</a></li>
<li><a href="https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html" target="_blank">[2] mysqldump — MySQL Documentation</a></li>
</ol>
