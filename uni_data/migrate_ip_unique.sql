-- IP별로 updated_at 가장 최근인 레코드만 남기고 중복 삭제
DELETE FROM ip_addresses
WHERE id NOT IN (
  SELECT DISTINCT ON (ip) id
  FROM ip_addresses
  ORDER BY ip, updated_at DESC NULLS LAST, id
);

-- ip 컬럼 UNIQUE 제약 추가
ALTER TABLE ip_addresses
  ADD CONSTRAINT uq_ip_addresses_ip UNIQUE (ip);


  CREATE TABLE IF NOT EXISTS deploy_schedules (
    id                  SERIAL PRIMARY KEY,
    deploy_at           TIMESTAMPTZ  NOT NULL,
    ticket_no           VARCHAR(100),
    title               VARCHAR(500) NOT NULL,
    registrant_name     VARCHAR(100) NOT NULL,
    registrant_slack_id VARCHAR(50)  NOT NULL,
    notified_30         BOOLEAN      DEFAULT FALSE,
    notified_15         BOOLEAN      DEFAULT FALSE,
    created_at          TIMESTAMPTZ  DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_deploy_at ON deploy_schedules (deploy_at);
  
  
  ALTER TABLE deploy_schedules ADD COLUMN IF NOT EXISTS hub_name VARCHAR(200);
  
  
  update deploy_schedules ds 
  set hub_name = '영원아웃도어'
  where id = '4';
  
  
  update deploy_schedules ds 
  set create_name = '오찬열';
  
   ALTER TABLE deploy_schedules ADD COLUMN IF NOT EXISTS create_name VARCHAR(100);
   
   
   
   ALTER TABLE deploy_schedules ADD COLUMN IF NOT EXISTS notify_minutes INT DEFAULT 15;
  ALTER TABLE deploy_schedules ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;