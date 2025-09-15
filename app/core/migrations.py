from sqlalchemy import inspect
from app.core.database import engine

def run_migrations():
    """데이터베이스 마이그레이션 실행"""
    try:
        insp = inspect(engine)
        
        # users 테이블 컬럼 확인
        try:
            user_cols = {c['name'] for c in insp.get_columns('users')}
        except:
            user_cols = set()
        
        # pending_signups 테이블 컬럼 확인
        try:
            pending_cols = {c['name'] for c in insp.get_columns('pending_signups')}
        except:
            pending_cols = set()
        
        with engine.begin() as conn:
            # users 테이블 마이그레이션
            if 'verify_code' not in user_cols:
                try:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN verify_code VARCHAR(6)")
                except:
                    pass  # 컬럼이 이미 존재하거나 테이블이 없는 경우 무시
            
            if 'verify_code_exp' not in user_cols:
                try:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN verify_code_exp TIMESTAMP")
                except:
                    pass  # 컬럼이 이미 존재하거나 테이블이 없는 경우 무시
            
            # Google OAuth 관련 필드 추가
            if 'google_id' not in user_cols:
                try:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN google_id VARCHAR(255)")
                    # unique 인덱스 추가
                    conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id)")
                except:
                    pass  # 컬럼이 이미 존재하거나 테이블이 없는 경우 무시
            
            if 'profile_picture' not in user_cols:
                try:
                    conn.exec_driver_sql("ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500)")
                except:
                    pass  # 컬럼이 이미 존재하거나 테이블이 없는 경우 무시
            
            # pending_signups 테이블에 username 컬럼 추가
            if 'username' not in pending_cols:
                try:
                    conn.exec_driver_sql("ALTER TABLE pending_signups ADD COLUMN username VARCHAR(50)")
                    
                    # 기존 데이터에 기본 username 설정
                    try:
                        conn.exec_driver_sql("""
                            UPDATE pending_signups 
                            SET username = 'user_' || id 
                            WHERE username IS NULL OR username = ''
                        """)
                    except:
                        pass  # 업데이트 실패 시 무시
                    
                    # unique 인덱스 추가
                    try:
                        conn.exec_driver_sql("CREATE UNIQUE INDEX IF NOT EXISTS ix_pending_signups_username ON pending_signups(username)")
                    except:
                        pass  # 인덱스 생성 실패 시 무시
                        
                except:
                    pass  # 컬럼 추가 실패 시 무시
        
        print("✅ 데이터베이스 마이그레이션 완료")
        return True
        
    except Exception as e:
        print(f"⚠️ 마이그레이션 실패 (앱은 계속 실행): {e}")
        return False
