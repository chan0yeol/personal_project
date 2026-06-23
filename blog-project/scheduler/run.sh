#!/bin/bash
export HOME=/home/chanyeol
export PATH="/home/chanyeol/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

CLAUDE=/home/chanyeol/.local/bin/claude
AGENT=/opt/blog-scheduler/agent.md
LOG=/opt/blog-scheduler/run.log

echo "" >> $LOG
echo "=== $(date '+%Y-%m-%d %H:%M:%S') 블로그 자동화 시작 ===" >> $LOG
$CLAUDE -p "$(cat $AGENT)" < /dev/null >> $LOG 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S') 완료 ===" >> $LOG
