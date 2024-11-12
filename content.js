let serverTimeOffset = 0;

const CONFIG = {
    TARGET_URL: 'https://www.ys-vertium-friends.co.kr/newpage/newpage.php?f_id=re_appli_typeA',// 'https://www.ys-vertium-friends.co.kr/live/contract.php?page_step=3&struct_type=48',
    TARGET_HOUR: 14,
    TARGET_MINUTE: 0,
    TARGET_SECOND: 0
};

async function syncServerTime() {
    try {
        const startTime = Date.now();
        const response = await fetch('https://www.ys-vertium-friends.co.kr/', {
            cache: 'no-store'
        });
        const endTime = Date.now();
        const networkDelay = (endTime - startTime) / 2;

        const serverDate = new Date(response.headers.get('date'));
        serverTimeOffset = serverDate.getTime() - (Date.now() - networkDelay);

        console.log('서버 시간:', new Date(Date.now() + serverTimeOffset).toLocaleString());
        return true;
    } catch (error) {
        console.error('서버 시간 동기화 실패:', error);
        return false;
    }
}

function getCurrentServerTime() {
    return new Date(Date.now() + serverTimeOffset);
}

async function autoClick() {
    try {
        // struct_idx 라디오 버튼 처리
        const radioButtons = document.querySelectorAll('input[name="struct_idx"]');
        if (radioButtons.length > 0) {
            // 라디오 버튼이 2개 이상이면 두 번째 것을, 아니면 첫 번째 것을 선택
            const buttonToClick = radioButtons.length >= 2 ? radioButtons[1] : radioButtons[0];
            buttonToClick.click();
            console.log(`라디오 버튼 선택됨 (${radioButtons.length}개 중 ${buttonToClick === radioButtons[1] ? '2' : '1'}번째)`);

            // 라디오 버튼 클릭 후 약간의 지연
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 체크박스가 있는 경우 (3번째 페이지)
        const checkbox = document.querySelector('#chkAll');
        if (checkbox) {
            checkbox.click();
            console.log('체크박스 모두 선택됨');
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 다음 버튼 클릭 (모든 페이지 공통)
        const nextButton = Array.from(document.getElementsByTagName('a'))
            .find(el => el.textContent.includes('다음'));
        if (nextButton) {
            nextButton.click();
            console.log('다음 버튼 클릭됨');
            return true;
        }

        console.log('다음 버튼을 찾지 못함');
        return false;
    } catch (error) {
        console.error('클릭 실패:', error);
        return false;
    }
}


function checkAndExecute() {
    const now = getCurrentServerTime();
    if (now.getHours() === CONFIG.TARGET_HOUR &&
        now.getMinutes() === CONFIG.TARGET_MINUTE &&
        now.getSeconds() === CONFIG.TARGET_SECOND) {

        // 현재 URL이 타겟 URL과 같은지 확인하고 새로고침
        if (window.location.href === CONFIG.TARGET_URL) {
            window.location.reload(true); // true를 전달하여 캐시를 무시하고 강제 새로고침
        } else {
            window.location.href = CONFIG.TARGET_URL;
        }
    }
}

// 페이지 로드 완료 시 자동 클릭 실행
function handlePageLoad() {
    const now = getCurrentServerTime();
    if (now.getHours() === CONFIG.TARGET_HOUR &&
        now.getMinutes() === CONFIG.TARGET_MINUTE) {
        autoClick();
    }
}

// 초기화 및 시작
async function initialize() {
    await syncServerTime();

    // 매 5분마다 서버 시간 동기화
    setInterval(syncServerTime, 5 * 60 * 1000);

    // 매 10ms마다 시간 체크
    setInterval(checkAndExecute, 10);

    // 페이지 로드 이벤트 리스너 추가
    window.addEventListener('load', handlePageLoad);

    // 상태 표시 UI 추가
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        font-family: monospace;
    `;
    document.body.appendChild(statusDiv);

    // 상태 업데이트
    setInterval(() => {
        const serverTime = getCurrentServerTime();
        const nextTarget = new Date(serverTime);
        nextTarget.setHours(CONFIG.TARGET_HOUR, CONFIG.TARGET_MINUTE, CONFIG.TARGET_SECOND, 0);

        if (serverTime >= nextTarget) {
            nextTarget.setDate(nextTarget.getDate() + 1);
        }

        const timeUntil = nextTarget - serverTime;
        const minutes = Math.floor(timeUntil / 1000 / 60);
        const seconds = Math.floor((timeUntil / 1000) % 60);

        statusDiv.innerHTML = `
            서버 시간: ${serverTime.toLocaleString()}<br>
            목표까지: ${minutes}분 ${seconds}초<br>
            라디오 버튼 수: ${document.querySelectorAll('input[name="struct_idx"]').length}<br>
            체크박스 존재: ${document.querySelector('#chkAll') ? 'Yes' : 'No'}
        `;
    }, 100);
}

// 페이지 변경 감지를 위한 MutationObserver 설정
const observer = new MutationObserver((mutations) => {
    const now = getCurrentServerTime();
    if (now.getHours() === CONFIG.TARGET_HOUR &&
        now.getMinutes() === CONFIG.TARGET_MINUTE) {
        autoClick();
    }
});

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});

initialize();
