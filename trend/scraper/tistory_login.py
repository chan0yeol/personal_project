from playwright.sync_api import sync_playwright
import time

def save_auth_state():
    with sync_playwright() as p:
        # 로그인 과정을 보기 위해 headless=False 로 실행
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # 티스토리 로그인 페이지 이동
        page.goto("https://www.tistory.com/auth/login")
        print("💡 카카오 로그인을 완료해 주세요. (2단계 인증 포함)")
        
        # 사용자가 로그인하고 블로그 관리 화면으로 이동할 때까지 대기 (최대 300초)
        page.wait_for_url("**/manage**", timeout=300000)
        
        # 로그인 상태(쿠키 등) 저장
        page.context.storage_state(path="tistory_auth_state.json")
        print("✅ 인증 상태가 tistory_auth_state.json 에 저장되었습니다.")
        
        browser.close()

if __name__ == "__main__":
    save_auth_state()