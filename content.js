let serverTimeOffset = 0;

const CONFIG = {
    TARGET_URL: 'https://www.ys-vertium-friends.co.kr/live/contract.php?page_step=1&struct_type=48',
    TARGET_HOUR: 14,
    TARGET_MINUTE: 56,
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
        // struct_idx 라디오 버튼이 있는 경우
        const radioButtons = document.querySelectorAll('input[name="struct_idx"]');
        if (radioButtons.length > 0) {
            radioButtons[1].click();
            console.log('라디오 버튼 선택됨');
            await new Promise(resolve => setTimeout(resolve, 100));

            // go_next 함수 호출
            if (typeof go_next === 'function') {
                go_next();
                console.log('go_next 함수 호출됨');
            }else{
                const nextButton = Array.from(document.getElementsByTagName('a'))
                    .find(el => el.textContent.includes('다음'));
                if (nextButton) {
                    nextButton.click();
                    console.log('다음 버튼 클릭됨');
                    return true;
                }
            }
            return true;
        }

        // 체크박스가 있는 경우
        const checkbox = document.querySelector('#chkAll');
        if (checkbox) {
            checkbox.click();
            console.log('체크박스 선택됨');
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const nextButton = Array.from(document.getElementsByTagName('a'))
            .find(el => el.textContent.includes('다음'));
        if (nextButton) {
            nextButton.click();
            console.log('다음 버튼 클릭됨');
            return true;
        }
        console.log('클릭할 요소를 찾지 못함');
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

        if (window.location.href !== CONFIG.TARGET_URL) {
            window.location.href = CONFIG.TARGET_URL;
        } else {
            autoClick();
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
    document.addEventListener('DOMContentLoaded', handlePageLoad);

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
