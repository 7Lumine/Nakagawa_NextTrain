
// 駅名の設定
const stationNameMap = {
    'Shonandai': '湘南台',
    'Nippa': '新羽',
    'Odoriba': '踊場',
    'Kaminagaya': '上永谷',
    'Azamino': 'あざみ野',
    'ShinYokohama': '新横浜'
};

//電車の表示本数
const ShownTrains = 3

document.addEventListener('DOMContentLoaded', () => {
        // 初期表示
    showDateTime();
    
    // 1秒ごとに更新
    setInterval(showDateTime, 1000);


    // ダイヤの判定をした上で両方向の時刻表を読み込む
    if (checkDiagram()) { //休日ダイヤ
        console.log('休日ダイヤ');
        document.querySelector('.dia').textContent = "休日ダイヤ";
        Promise.all([
        fetch('./timetables/nakagawa_holiday_azamino.csv').then(response => response.text()),
        fetch('./timetables/nakagawa_holiday_others.csv').then(response => response.text())
        ]).then(([azaminoData, othersData]) => {
            updateTrains(azaminoData, othersData);
            setInterval(() => updateTrains(azaminoData, othersData), 10000);
        });
    } else { //平日ダイヤ
        console.log('平日ダイヤ');
        document.querySelector('.dia').textContent = "平日ダイヤ";
        Promise.all([
        fetch('./timetables/nakagawa_weekday_azamino.csv').then(response => response.text()),
        fetch('./timetables/nakagawa_weekday_others.csv').then(response => response.text())
        ]).then(([azaminoData, othersData]) => {
            updateTrains(azaminoData, othersData);
            setInterval(() => updateTrains(azaminoData, othersData), 10000);
        });
    }

});



function checkDiagram() {
    const date = new Date();
    if (holiday_jp.isHoliday(date) || date.getDay() === 0 || date.getDay() === 6) { //祝日か日曜か土曜
        return true;
    } else {
        return false;
    }
}
function showClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.querySelector('.current-time').textContent = `現在時刻：${time}`;
}

function getNextTrains(csvData) {
    const lines = csvData.split('\n').slice(1);
    const trains = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    lines.forEach(line => {
        if (!line.trim()) return;
            const [type, time, destination] = line.split(',');
            const [hour, minute] = time.split(':').map(Number);
            const trainTime = hour * 60 + minute;
            const currentTime = currentHour * 60 + currentMinute;

        // 現在時刻が23時以降で、電車が0時台の場合
        if (currentHour >= 23 && hour < 4) {
            trainTime += 24 * 60; // 翌日の時刻として計算
        }

        // 電車時刻が現在時刻以降の場合のみ追加
        if (trainTime >= currentTime) {
            trains.push({
                type: type,
                time: time,
                destination: destination,
                minutesUntil: trainTime - currentTime
            });
        }
    });

    trains.sort((a, b) => a.minutesUntil - b.minutesUntil);
    return trains.slice(0, ShownTrains);
}

function updateTrains(azaminoData, othersData) {
    const azaminoTrains = getNextTrains(azaminoData);
    const othersTrains = getNextTrains(othersData);

    updateDirectionDisplay('azamino-trains', azaminoTrains);
    updateDirectionDisplay('others-trains', othersTrains);
}

function updateDirectionDisplay(elementId, trains) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    trains.forEach(train => {
        const div = document.createElement('div');
        div.className = 'train-info';
        // 発車5分未満の場合、data-minutes-left属性を設定
        if (train.minutesUntil < 5) {
            div.setAttribute('data-minutes-left', train.minutesUntil.toString());
        }
        div.innerHTML = `
            <div>発車時刻 <br> ${train.time}</div>
            <div>終点 <br> ${convertStationName(train.destination)} - ${train.type === 'Local' ? '普通' : '快速'}</div>
            <div>発車まで <br> ${train.minutesUntil}分</div>
        `;
        container.appendChild(div);
    });
}

function showDateTime() {
    const now = new Date();
    
    // 時刻のフォーマット
    const time = now.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // 曜日の配列
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    
    // 日付のフォーマット
    const dateStr = now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) + ` (${weekDays[now.getDay()]})`;
    
    // 画面に表示
    document.querySelector('.current-time').textContent = `現在時刻：${time}`;
    document.querySelector('.current-date').textContent = dateStr;
}

// 駅名を変換する関数
function convertStationName(englishName) {
    return stationNameMap[englishName] || englishName; // マップにない場合は元の名前を返す
}