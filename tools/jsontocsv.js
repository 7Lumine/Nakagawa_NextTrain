const fs = require('fs');

try {
  const jsonData = JSON.parse(fs.readFileSync('jikoku.json', 'utf8'));

  // データを格納する配列
  const weekdayAzamino = [];
  const weekdayOthers = [];
  const holidayAzamino = [];
  const holidayOthers = [];

  // 中川駅のデータをフィルタリング
  jsonData.forEach(station => {
    if (station['odpt:station'] === 'odpt.Station:YokohamaMunicipal.Blue.Nakagawa') {
      const isHoliday = station['odpt:calendar'].includes('SaturdayHoliday');
      
      station['odpt:stationTimetableObject'].forEach(train => {
        const data = {
          type: train['odpt:trainType'].split('.').pop(),
          time: train['odpt:departureTime'],
          destination: train['odpt:destinationStation'][0].split('.').pop()
        };

        if (data.destination === 'Azamino') {
          if (isHoliday) {
            holidayAzamino.push(data);
          } else {
            weekdayAzamino.push(data);
          }
        } else {
          if (isHoliday) {
            holidayOthers.push(data);
          } else {
            weekdayOthers.push(data);
          }
        }
      });
    }
  });

  // CSVヘッダー
  const csvHeader = "列車種別,発車時刻,行先駅\n";

  // データをCSV形式に変換する関数
  const convertToCSV = (trains) => {
    return trains
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(train => `${train.type},${train.time},${train.destination}`)
      .join('\n');
  };

  // 4つのCSVファイルを作成
  fs.writeFileSync(
    'nakagawa_weekday_azamino.csv', 
    csvHeader + convertToCSV(weekdayAzamino), 
    'utf8'
  );

  fs.writeFileSync(
    'nakagawa_weekday_others.csv', 
    csvHeader + convertToCSV(weekdayOthers), 
    'utf8'
  );

  fs.writeFileSync(
    'nakagawa_holiday_azamino.csv', 
    csvHeader + convertToCSV(holidayAzamino), 
    'utf8'
  );

  fs.writeFileSync(
    'nakagawa_holiday_others.csv', 
    csvHeader + convertToCSV(holidayOthers), 
    'utf8'
  );

  console.log('CSVファイルが作成されました');

} catch (error) {
  console.error('エラーが発生しました:', error);
}
