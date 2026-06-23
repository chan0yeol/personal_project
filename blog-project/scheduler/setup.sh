#!/bin/bash
# 홈서버 세팅 스크립트 (1회만 실행)

mkdir -p /opt/blog-scheduler

cp agent.md /opt/blog-scheduler/agent.md
cp run.sh /opt/blog-scheduler/run.sh
chmod +x /opt/blog-scheduler/run.sh

# cron 등록 (매일 02:00 KST = 17:00 UTC)
(crontab -l 2>/dev/null; echo "0 17 * * * /opt/blog-scheduler/run.sh") | crontab -

echo "✅ 세팅 완료"
echo "즉시 테스트: /opt/blog-scheduler/run.sh"
echo "로그 확인:   tail -f /opt/blog-scheduler/run.log"
