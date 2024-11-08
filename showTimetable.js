// 駅名の設定

let currentTimetableData = '';

const stationNameMap = {
    'Shonandai': '湘南台',
    'Nippa': '新羽',
    'Odoriba': '踊場',
    'Kaminagaya': '上永谷',
    'Azamino': 'あざみ野',
    'ShinYokohama': '新横浜'
};

// convertStationName関数の定義
function convertStationName(stationKey) {
    return stationNameMap[stationKey] || stationKey;
}

document.addEventListener('DOMContentLoaded', () => {
    const timetableElement = document.querySelector('#timetable');
    if (timetableElement) {
        fetch(handleTimetableType(timetableElement))
            .then(response => response.text())
            .then((Data) => {
                updateTrains(Data);
            })
            .catch(error => console.error('Error fetching timetable:', error));
    } else {
        console.error('Timetable element not found');
    }
});

//トグルボタン
document.addEventListener('DOMContentLoaded', () => {
    const weekdayButton = document.getElementById('weekdayButton');
    const holidayButton = document.getElementById('holidayButton');
    const timetableElement = document.querySelector('#timetable');
    const currentType = timetableElement.getAttribute('data-type');
    const weekday = 'weekday_' + currentType;
    const holiday = 'holiday_' + currentType;
    console.log(currentType);
  
    weekdayButton.addEventListener('click', () => {
      weekdayButton.classList.add('active');
      holidayButton.classList.remove('active');
      timetableElement.setAttribute('data-type', weekday);
      updateTimetable(weekday);
    });
  
    holidayButton.addEventListener('click', () => {
      holidayButton.classList.add('active');
      weekdayButton.classList.remove('active');
      timetableElement.setAttribute('data-type', holiday);
      updateTimetable(holiday);
    });
  
    function updateTimetable(type) {
      fetch(handleTimetableType(timetableElement))
        .then(response => response.text())
        .then((data) => {
          updateTrains(data);
        })
        .catch(error => console.error('Error fetching timetable:', error));
    }
  });
  // ここまでトグルボタン

  // 現在時刻から最も近い時刻を見つける関数
function findNearestTime(trains) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    let nearestTrain = null;
    let minTimeDiff = Infinity;
    
    trains.forEach(train => {
        const timeDiff = (train.hour - currentHour) * 60 + (train.minute - currentMinute);
        if (timeDiff >= 0 && timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            nearestTrain = train;
        }
    });
    
    return nearestTrain;
}

// スクロール機能を実装
function scrollToNearestTime() {
    const timetableElement = document.querySelector('#timetable');
    const trains = loadTimetable(currentTimetableData);
    const nearestTrain = findNearestTime(trains);
    
    if (nearestTrain) {
        const timeString = `${nearestTrain.hour.toString().padStart(2, '0')}:${nearestTrain.minute.toString().padStart(2, '0')}`;
        const trainElements = document.querySelectorAll('.train-info');
        
        for (const element of trainElements) {
            if (element.querySelector('time').textContent === timeString) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.style.backgroundColor = '#fff3cd';
                setTimeout(() => {
                    element.style.backgroundColor = '';
                }, 3000);
                break;
            }
        }
    }
}

// HTMLに「現在時刻」ボタンを追加
document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.querySelector('.header-container');
    const currentTimeButton = document.createElement('button');
    currentTimeButton.className = 'current-time-button';
    currentTimeButton.textContent = '次の電車';
    currentTimeButton.onclick = scrollToNearestTime;
    headerContainer.appendChild(currentTimeButton);
});

// ここまでスクロール機能
// ページトップへ戻るボタンを追加
document.addEventListener('DOMContentLoaded', () => {
    // ボタン要素の作成
    const topButton = document.createElement('button');
    topButton.className = 'scroll-top-button';
    topButton.innerHTML = '↑';
    document.body.appendChild(topButton);

    // スクロールイベントの処理
    window.addEventListener('scroll', () => {
        if (window.scrollY > 200) {
            topButton.classList.add('visible');
        } else {
            topButton.classList.remove('visible');
        }
    });

    // クリックイベントの処理
    topButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// 要求されている時刻表を判断
function handleTimetableType(element) {
    const TimetableType = element.getAttribute('data-type');
    switch (TimetableType) {
        case 'holiday_azamino':
            console.log('holiday_azamino');
            return './timetables/nakagawa_holiday_azamino.csv';
        case 'azamino':
        case 'weekday_azamino':
            console.log('weekday_azamino');
            return './timetables/nakagawa_weekday_azamino.csv';
        case 'others':
        case 'weekday_others':
            console.log('weekday_others');
            return './timetables/nakagawa_weekday_others.csv';
        case 'holiday_others':
            console.log('holiday_others');
            return './timetables/nakagawa_holiday_others.csv';
        default:
            console.error('未知のタイムテーブルタイプ:', TimetableType);
            return undefined;
    }
}

function loadTimetable(csvData) {
    const lines = csvData.split('\n').slice(1);
    const regularTrains = [];
    const earlyMorningTrains = [];
    
    lines.forEach(line => {
        if (!line.trim()) return;
        const [type, time, destination] = line.split(',');
        const [hour, minute] = time.split(':').map(Number);
        const trainData = { type, time, hour, minute, destination };
        
        // 0:00から5:00までの電車を分類
        if (hour >= 0 && hour < 5) {
            earlyMorningTrains.push(trainData);
        } else {
            regularTrains.push(trainData);
        }
    });
    
    // 通常の電車と早朝の電車を結合
    return [...regularTrains, ...earlyMorningTrains];
}

function updateTrains(Data) {
    currentTimetableData = Data;
    const Trains = loadTimetable(Data);
    updateTimetableDisplay('timetable', Trains);
}

function updateTimetableDisplay(elementId, trains) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';
    
    let lastWasRegular = true;
    let firstEarlyMorning = true;
    
    trains.forEach(train => {
        const div = document.createElement('div');
        div.className = 'train-info';
        const typeClass = train.type === 'Local' ? 'local' : 'rapid';
        
        // 深夜早朝の電車の前に区切り線を追加
        if (firstEarlyMorning && train.hour >= 0 && train.hour < 5 && lastWasRegular) {
            const separator = document.createElement('div');
            separator.className = 'time-separator';
            separator.textContent = '深夜・早朝';
            container.appendChild(separator);
            firstEarlyMorning = false;
        }
        
        div.innerHTML = `
            <div>
                <time>${train.time}</time>
                ${convertStationName(train.destination)}
                <span class="type ${typeClass}">${train.type === 'Local' ? '普通' : '快速'}</span>
            </div>
        `;
        
        container.appendChild(div);
        lastWasRegular = !(train.hour >= 0 && train.hour < 5);
    });
}