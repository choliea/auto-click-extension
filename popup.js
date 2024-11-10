document.addEventListener('DOMContentLoaded', function () {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const targetTime = document.getElementById('targetTime');
    const status = document.getElementById('status');

    // 저장된 설정 불러오기
    chrome.storage.local.get(['targetTime', 'isRunning'], function (result) {
        if (result.targetTime) {
            targetTime.value = result.targetTime;
        }
        updateStatus(result.isRunning);
    });

    startBtn.addEventListener('click', function () {
        const time = targetTime.value;
        chrome.storage.local.set({
            targetTime: time,
            isRunning: true
        });

        chrome.runtime.sendMessage({
            action: 'start',
            targetTime: time
        });

        updateStatus(true);
    });

    stopBtn.addEventListener('click', function () {
        chrome.storage.local.set({ isRunning: false });
        chrome.runtime.sendMessage({ action: 'stop' });
        updateStatus(false);
    });

    function updateStatus(isRunning) {
        status.textContent = isRunning ? '실행 중' : '중지됨';
        status.style.backgroundColor = isRunning ? '#e7ffe7' : '#ffe7e7';
    }
});
