// タイトルと上映時間を取得する関数
function extractMovieInfo(item) {
  // タイトル
  const titleElement = item.querySelector(".movieTitle");
  if (!titleElement) return null;
  const title = titleElement.innerText.trim();

  // 上映時間
  const timeElements = Array.from(
    item.querySelectorAll(".startTime, .endTime")
  );
  const times = timeElements.map((e) => e.innerText.trim());

  if (!title || times.length === 0) return null;

  // タイトルと上映時間をオブジェクトで返す
  return {
    title,
    times: chunkArray(times, 2).map((time) => ({
      start: time[0],
      end: time[1],
    })),
  };
}

// 配列を所定のサイズでチャンクに分割する関数
function chunkArray(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

// 映画情報を保存する配列
const movies = [];

// ターゲットとなる<li>タグをすべて取得
const movieItems = document.querySelectorAll("li.clearfix");

// 各<li>タグに対して映画情報を抽出
const extractedMovies = Array.from(movieItems)
  .map(extractMovieInfo)
  .filter(Boolean);
movies.push(...extractedMovies);

// UI要素を作成
function createUIElement() {
  const label = document.createElement("label");
  label.textContent = "AIアシスタントに質問";
  label.classList.add("head01");
  const inputTextbox = document.createElement("textarea");
  inputTextbox.type = "text";
  inputTextbox.style.width = "100%";
  inputTextbox.style.height = "100px";
  inputTextbox.style.resize = "none";
  inputTextbox.verticalAlign = "top";
  inputTextbox.placeholder = "今夜のおすすめは？";
  inputTextbox.style.boxSizing = "border-box";
  const outputTextbox = document.createElement("textarea");
  outputTextbox.type = "text";
  outputTextbox.style.width = "100%";
  outputTextbox.style.height = "300px";
  outputTextbox.style.resize = "none";
  outputTextbox.verticalAlign = "top";
  outputTextbox.readOnly = true;
  outputTextbox.style.boxSizing = "border-box";
  const button = document.createElement("button");
  button.textContent = "ChatGPTに聞いてみる";
  button.style.width = "100%";
  button.style.height = "20px";

  return { label, inputTextbox, button, outputTextbox };
}

const { label, inputTextbox, button, outputTextbox } = createUIElement();

async function fetchChatGPTResponse(
  API_KEY,
  systemPrompt,
  userText,
  gptVersion = "gpt-3.5-turbo"
) {
  const URL = "https://api.openai.com/v1/chat/completions";
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: gptVersion,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error("API call failed");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function generateSystemPrompt(movies) {
  const currentTime = new Date().toLocaleTimeString();
  const movieSchedules = movies
    .map(
      (movie) =>
        `title: ${movie.title}, start: ${movie.times
          .map((time) => time.start)
          .join(", ")}`
    )
    .join("; ");

  return `あなたはchrome拡張機能として実装されたAIアシスタントです。上映スケジュールを元に、おすすめの映画を提案します。簡潔にお願いします。現在の時刻は${currentTime}です。上映スケジュールは以下の通りです。 ${movieSchedules}`;
}

button.onclick = async function () {
  const originalButtonText = button.textContent;
  button.textContent = "処理中..."; // ボタンのテキストを変更
  button.disabled = true; // ボタンを無効化

  chrome.storage.local.get(["apiKey", "gptVersion"], async function (data) {
    if (data.apiKey && data.gptVersion) {
      try {
        const API_KEY = data.apiKey;
        const userText = inputTextbox.value || inputTextbox.placeholder;
        const systemPrompt = generateSystemPrompt(movies);
        const chatGPTResponse = await fetchChatGPTResponse(
          API_KEY,
          systemPrompt,
          userText,
          data.gptVersion
        );
        outputTextbox.value = chatGPTResponse;
      } catch (error) {
        console.error(error);
      } finally {
        button.textContent = originalButtonText; // ボタンのテキストを元に戻す
        button.disabled = false; // ボタンを再度有効化
      }
    } else {
      button.textContent = originalButtonText; // ボタンのテキストを元に戻す
      button.disabled = false; // ボタンを再度有効化
      alert("APIキーを設定してください");
      chrome.runtime.sendMessage({ action: "openOptionsPage" });
    }
  });
};

const div = document.createElement("div");
div.appendChild(label);
div.appendChild(inputTextbox);
div.appendChild(button);
div.appendChild(outputTextbox);
div.style.backgroundColor = "#DDD";
div.style.padding = "8px";

const targetElement = document.querySelector("#col_sub");

if (targetElement) {
  targetElement.insertBefore(div, targetElement.firstChild);
} else {
  console.error("#col_main > section > div.inner element not found.");
}
