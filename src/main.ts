import "./main.less";
import { $, SequentialExecutor } from "@xiaotianxt/monkey-tool";
(async function () {
  const inputExecutor = new SequentialExecutor();
  const SEND_BTN = "button[data-testid='send-button']";
  const SEND_BTN_AVAILABLE = "*[data-testid='send-button']:not([disabled])";
  const STOP_BTN = "button[aria-label='Stop generating']";
  const TEXT_AREA = "#prompt-textarea";
  const ERROR_BTN = "button:has([points='1 4 1 10 7 10'])";

  const wait = async (...elements: string[]) => {
    if (elements.every((e) => !!$(e))) return $(elements[0]) as HTMLElement;
    return new Promise<HTMLElement>((r) => {
      const observer = new MutationObserver(() => {
        if (elements.every((e) => !!$(e))) {
          observer.disconnect();
          r($(elements[0]) as HTMLElement);
        }
      });
      observer.observe(document, {
        childList: true,
        attributes: true,
        subtree: true,
      });
    });
  };

  await wait(SEND_BTN, TEXT_AREA);

  const mockInput = async () => {
    const text = wordList.pop();
    if (!text) return;
    // 检查回应是否完成
    const waitUntilFinished = async (retry = 5) => {
      if (retry === 0) throw new Error("Too many errors");
      await wait(STOP_BTN);
      await Promise.race([wait(ERROR_BTN), wait(SEND_BTN)]);
      if ($(ERROR_BTN)) {
        ($(ERROR_BTN) as HTMLButtonElement).click();

        waitUntilFinished(retry - 1);
      }
    };

    // 模拟输入
    const element = (await wait(TEXT_AREA)) as HTMLTextAreaElement;
    element.value = text;
    element.dispatchEvent(new Event("input", { bubbles: true }));

    // 链接成功建立
    (await wait(SEND_BTN_AVAILABLE)).click();

    await waitUntilFinished();
  };

  const sequentialMockInput = async () => inputExecutor.execute(mockInput);

  class WordList {
    words: string[] = [];
    memo: Map<string, HTMLDivElement> = new Map();
    node: HTMLDivElement;
    wordContainer: HTMLDivElement;
    wordHistory: HTMLDivElement;
    enabled: boolean = false;

    constructor() {
      this.node = document.createElement("div");
      this.node.classList.add("word-container");

      const stickBtn = document.createElement("button");
      stickBtn.title = "Stick on side";
      stickBtn.innerHTML = "&#128204;";
      stickBtn.addEventListener("click", () => {
        stickBtn.classList.toggle("active");
      });
      this.node.appendChild(stickBtn);

      const watchInput = document.createElement("label");
      watchInput.innerHTML = "<input type='checkbox' /> Watch input";
      watchInput.addEventListener("click", async (e) => {
        if ((e.target as HTMLInputElement).checked) {
          this.enabled = true;
          while (this.enabled) {
            await new Promise((r) => setTimeout(r, 1000));
            await sequentialMockInput();
          }
        } else {
          this.enabled = false;
        }
      });
      this.node.appendChild(watchInput);

      const input = document.createElement("input");
      input.addEventListener("paste", (e) => {
        e.preventDefault();
        const text = e.clipboardData?.getData("text") || "";
        const words = text.split(/\s+/);
        input.value = "";
        words.forEach((w) => this.push(w));
      });
      input.addEventListener("keydown", (e) => {
        // Enter pressed
        if (e.key === "Enter" && input.value.trim()) {
          this.push(input.value.trim());
          input.value = "";
        }
      });
      this.node.appendChild(input);

      this.wordContainer = document.createElement("div");
      this.node.appendChild(this.wordContainer);

      this.wordHistory = document.createElement("div");
      this.node.appendChild(this.wordHistory);

      document.body.appendChild(this.node);
    }

    pop(item?: string) {
      item = item || this.words.shift();
      if (!item) return;
      const div = this.memo.get(item);
      if (div) div.remove();

      return item;
    }

    remove(item: string) {
      const div = this.memo.get(item);
      if (!div) throw new Error("Item not found");
      div.remove();

      this.words = this.words.filter((w) => w !== item);
      this.memo.delete(item);

      this.wordHistory.appendChild(div.cloneNode(true));
    }

    push(item: string) {
      if (this.memo.get(item)) return;
      this.words.push(item);
      const div = document.createElement("div");
      div.innerText = item;
      this.memo.set(item, div);
      this.wordContainer.appendChild(div);
      div.addEventListener("click", () => this.remove(item));
    }
  }

  const wordList = new WordList();
})();
