document.addEventListener("DOMContentLoaded", function () {
  console.log("hyouzi");
  // 保存されたAPIキーとGPTのバージョンを読み込む
  chrome.storage.local.get(["apiKey", "gptVersion"], function (data) {
    console.log("get");
    if (data.apiKey) {
      document.getElementById("apiKey").value = data.apiKey;
    }
    if (data.gptVersion) {
      document.getElementById("gptVersion").value = data.gptVersion;
    } else {
      document.getElementById("gptVersion").value = "gpt-3.5-turbo"; // デフォルト値
    }
  });

  // Saveボタンにクリックイベントを追加
  document.getElementById("saveButton").addEventListener("click", function () {
    console.log("Button clicked");
    // テキストボックスからAPIキーを読み取る
    const apiKey = document.getElementById("apiKey").value;
    // セレクトボックスからGPTのバージョンを読み取る
    const gptVersion = document.getElementById("gptVersion").value;

    // APIキーとGPTのバージョンをストレージに保存
    chrome.storage.local.set(
      { apiKey: apiKey, gptVersion: gptVersion },
      function () {
        alert("Settings saved.");
      }
    );
  });
});
