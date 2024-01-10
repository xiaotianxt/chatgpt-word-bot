import "./index.less";

(async function () {
  const $ = (selector: string, element: ParentNode = document) =>
    element.querySelector(selector);
  const $$ = (selector: string, element: ParentNode = document) =>
    element.querySelectorAll(selector);

  const SEND_BTN = "button[data-testid='send-button']";
  const SEND_BTN_AVAILABLE = "*[data-testid='send-button']:not([disabled])";
  const STOP_BTN = "button[aria-label='Stop generating']";
  const TEXT_AREA = "#prompt-textarea";
  const ERROR_BTN = "button:has([points='1 4 1 10 7 10'])";

  const wait = async (...elements: string[]) => {
    if (elements.every((e) => !!$(e))) return $(elements[0]) as HTMLElement;
    return new Promise<HTMLElement>((r) => {
      const observer = new MutationObserver((mutations) => {
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

  const mockInput = async (text: string) => {
    // 模拟输入
    const element = (await wait(TEXT_AREA)) as HTMLTextAreaElement;
    element.value = text;
    element.dispatchEvent(new Event("input", { bubbles: true }));

    // 链接成功建立
    (await wait(SEND_BTN_AVAILABLE)).click();

    // 检查回应是否完成
    const checkResult = async (level = 5) => {
      if (level === 0) throw new Error("Too many errors");
      await wait(STOP_BTN);
      await Promise.race([wait(ERROR_BTN), wait(SEND_BTN)]);
      if ($(ERROR_BTN)) {
        ($(ERROR_BTN) as HTMLButtonElement).click();

        checkResult(level - 1);
      }
    };

    await checkResult();
  };

  class WordList {
    words: string[] = [];
    memo: Map<string, HTMLDivElement> = new Map();
    node: HTMLDivElement;
    wordContainer: HTMLDivElement;
    enabled: boolean = false;

    constructor() {
      this.node = document.createElement("div");
      this.node.classList.add("word-container");
      const watchInput = document.createElement("label");
      watchInput.innerHTML = "<input type='checkbox' /> Watch input";
      watchInput.addEventListener("click", async (e) => {
        if ((e.target as HTMLInputElement).checked) {
          this.enabled = true;
          while (this.enabled) {
            await this.pop();
            await new Promise((r) => setTimeout(r, 1000));
          }
        } else {
          this.enabled = false;
        }
      });
      this.node.appendChild(watchInput);

      const input = document.createElement("input");
      input.addEventListener("paste", (e) => {
        const text = (e as ClipboardEvent).clipboardData.getData("text");
        const words = text.split(/\s+/);
        words.forEach(this.push);
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

      document.body.appendChild(this.node);
    }

    async pop(item?: string) {
      item = item || this.words.shift();
      if (!item) return;
      const div = this.memo.get(item);
      if (div) div.remove();

      return mockInput(item);
    }

    push(item: string) {
      this.words.push(item);
      const div = document.createElement("div");
      div.innerText = item;
      div.addEventListener("click", () => this.pop(item));
      this.memo.set(item, div);
      this.wordContainer.appendChild(div);
    }
  }
  const wordList = new WordList();
})();
