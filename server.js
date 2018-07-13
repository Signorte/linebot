'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

// デプロイ時コマンド now -e ACCESS_TOKEN=@access-token -e CHANNEL_SECRET=@channel-secret
const config = {
    channelAccessToken: process.env.ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
};

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);
    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  let repMes = ''; //返却用メッセージ
  let sendMes = event.message.text; // 送信されたメッセージ

  if (/おはよう/.test(sendMes)){
    // 発言に「おはよう」が含まれていた時のリプライ
    let date = getDate();
    repMes = 'おはようございます。\n' +
              `本日は ${date} です。\n` +
              '今日も一日頑張りましょう！';
  } else if (/おやすみ/.test(sendMes) || /お休み/.test(sendMes)) {
    // 発言に「おやすみ」または「お休み」が含まれていた時のリプライ
    repMes = 'おやすみなさい。\nまた明日。';
  } else if (/行ってきます/.test(sendMes) || /いってきます/.test(sendMes)) {
    // 発言に「行ってきます」または「いってきます」が含まれていた時のリプライ
    repMes = '行ってらっしゃい、\nお仕事頑張ってくださいね。';
  } else if (/ただいま/.test(sendMes)) {
    // 発言に「ただいま」が含まれていた時のリプライ
    repMes = 'おかえりなさい、\n今日もお仕事お疲れ様。';
  } else if (/今日の天気/.test(sendMes)) {
    // 発言に「今日の天気」が含まれていた時のリプライ
    repMes = '今日の天気ですね？\nちょっと待ってて下さい';
    getWeather(event.source.userId, 0);
  } else if (/明日の天気/.test(sendMes)) {
    // 発言に「明日の天気」が含まれていた時のリプライ
    repMes = '明日の天気ですね?\nちょっと待ってて下さい';
    getWeather(event.source.userId, 1);
  } else if (/ありがとう/.test(sendMes)) {
    repMes = 'ふふっ♪\nどういたしまして。';
  } else if (/好きです/.test(sendMes)) {
    repMes = '私も好きですよ。';
  } else {
    // それ以外は発言をそのまま返す
    repMes = sendMes;
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: repMes
  });
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);

/**
 * 現在の日付を取得する。
 *
 * @return 日付 [月/日(曜日)]
 */
const getDate = () => {
  let today = new Date(); //今日の日付データ

  // 月日取得
  let month = today.getMonth() + 1;
  let day = today.getDate();
  let week = today.getDay();

  // 曜日格納用配列
  let weekDay = new Array("日", "月", "火", "水", "木", "金", "土");

  let formatDate = `${month}/${day} ${weekDay[week]}曜日`;

  return formatDate;
}

/**
 * 天気情報を取得し、ユーザにプッシュする
 * @param {*} userId プッシュ先のユーザID
 * @param {*} dayId　いつの情報を取得するかを決める(0: 今日, 1: 明日)
 */
const getWeather = async (userId, dayId) => {
  // 天気情報(json形式)をAPIから取得
  const res = await axios.get('http://weather.livedoor.com/forecast/webservice/json/v1?city=130010');
  const item = res.data;

  // 日付と地域名と天気を取得
  const city = item.location.city;
  const dayLabel = item.forecasts[dayId].dateLabel;
  const weather = item.forecasts[dayId].telop;
  const date = item.forecasts[dayId].date;

  await client.pushMessage(userId, {
    type: 'text',
    text: `${dayLabel}(${date})の${city}の天気は\n${weather}です。`
  });
}

// app.listen(PORT);
// console.log(`Server running at ${PORT}`);
