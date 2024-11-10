// ==UserScript==
// @name         Auto Click with Server Time
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto click at specific time with server sync
// @match        https://www.ys-vertium-friends.co.kr/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 설정
    const CONFIG = {
        TARGET_URL: 'https://www.ys-vertium-friends.co.kr/live/contract.php?page_step=2&struct_type=48',
        TARGET_HOUR: 14,
        TARGET_MINUTE: 18,
        TARGET_SECOND: 0,
        RETRY_COUNT: 5,
        RETRY_INTERVAL: 1000,
        TIME_SYNC_INTERVAL: 5 * 60 * 1000, // 5분
        DISPLAY_UPDATE_INTERVAL: 100
    };

    // 서버 시간 관리
    const TimeManager = {
        offset: 0,

        async sync() {
            try {
                const startTime = Date.now();
                const response = await fetch('https://www.ys-vertium-friends.co.kr/', {
                    cache: 'no-store'
                });
                const endTime = Date.now();
                const networkDelay = (endTime - startTime) / 2;

                const serverDate = new Date(response.headers.get('date'));
                this.offset = serverDate.getTime() - (Date.now() - networkDelay);

                console.log('서버 시간 동기화:', this.getCurrentTime().toLocaleString());
                return true;
            } catch (error) {
                console.error('서버 시간 동기화 실패:', error);
                return false;
            }
        },

        getCurrentTime() {
            return new Date(Date.now() + this.offset);
        },

        getTimeUntilTarget() {
            const now = this.getCurrentTime();
            const target = new Date(now);
            target.setHours(CONFIG.TARGET_HOUR, CONFIG.TARGET_MINUTE, CONFIG.TARGET_SECOND, 0);

            if (now >= target) {
                target.setDate(target.getDate() + 1);
            }

            return target - now;
        }
    };

    // UI 관리
    const UIManager = {
        timeDisplay: null,

        init() {
            this.createTimeDisplay();
            this.startTimeUpdate();
        },

        createTimeDisplay() {
            this.timeDisplay = document.createElement('div');
            this.timeDisplay.style.cssText = `
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
            document.body.appendChild(this.timeDisplay);
        },

        startTimeUpdate() {
            setInterval(() => {
                const serverTime = TimeManager.getCurrentTime();
                const timeUntilTarget = TimeManager.getTimeUntilTarget();
                const minutes = Math.floor(timeUntilTarget / 1000 / 60);
                const seconds = Math.floor((timeUntilTarget / 1000) % 60);

                this.timeDisplay.innerHTML = `
                    서버 시간: ${serverTime.toLocaleString()}<br>
                    목표까지: ${minutes}분 ${seconds}초
                `;
            }, CONFIG.DISPLAY_UPDATE_INTERVAL);
        }
    };

    // 자동 클릭 관리
    const ClickManager = {
        async execute() {
            try {
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
                return false;
            } catch (error) {
                console.error('클릭 실패:', error);
                return false;
            }
        },

        async retryClick() {
            for (let i = 0; i < CONFIG.RETRY_COUNT; i++) {
                if (await this.execute()) return true;
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_INTERVAL));
            }
            return false;
        }
    };

    // 메인 프로세스
    class MainProcess {
        async init() {
            await TimeManager.sync();
            UIManager.init();
            this.startScheduler();

            // 주기적 시간 동기화
            setInterval(() => TimeManager.sync(), CONFIG.TIME_SYNC_INTERVAL);
        }

        async startScheduler() {
            const timeUntilTarget = TimeManager.getTimeUntilTarget();
            console.log(`다음 실행까지 ${Math.floor(timeUntilTarget / 1000 / 60)}분 남음`);

            setTimeout(() => {
                const checkInterval = setInterval(() => {
                    const now = TimeManager.getCurrentTime();
                    if (now.getHours() === CONFIG.TARGET_HOUR &&
                        now.getMinutes() === CONFIG.TARGET_MINUTE &&
                        now.getSeconds() === CONFIG.TARGET_SECOND) {
                        clearInterval(checkInterval);
                        this.startProcess();
                    }
                }, 10);
            }, timeUntilTarget - 1000);
        }

        async startProcess() {
            if (window.location.href !== CONFIG.TARGET_URL) {
                window.location.href = CONFIG.TARGET_URL;
                return;
            }

            await ClickManager.retryClick();
        }
    }

    // 스크립트 시작
    new MainProcess().init();
})();
