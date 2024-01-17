(function() {
  "use strict";
  (async function() {
    const $ = (selector, element = document) => element.querySelector(selector);
    const SEND_BTN = "button[data-testid='send-button']";
    const SEND_BTN_AVAILABLE = "*[data-testid='send-button']:not([disabled])";
    const STOP_BTN = "button[aria-label='Stop generating']";
    const TEXT_AREA = "#prompt-textarea";
    const ERROR_BTN = "button:has([points='1 4 1 10 7 10'])";
    const wait = async (...elements) => {
      if (elements.every((e) => !!$(e)))
        return $(elements[0]);
      return new Promise((r) => {
        const observer = new MutationObserver((mutations) => {
          if (elements.every((e) => !!$(e))) {
            observer.disconnect();
            r($(elements[0]));
          }
        });
        observer.observe(document, {
          childList: true,
          attributes: true,
          subtree: true
        });
      });
    };
    await wait(SEND_BTN, TEXT_AREA);
    const mockInput = async (text) => {
      const element = await wait(TEXT_AREA);
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      (await wait(SEND_BTN_AVAILABLE)).click();
      const checkResult = async (level = 5) => {
        if (level === 0)
          throw new Error("Too many errors");
        await wait(STOP_BTN);
        await Promise.race([wait(ERROR_BTN), wait(SEND_BTN)]);
        if ($(ERROR_BTN)) {
          $(ERROR_BTN).click();
          checkResult(level - 1);
        }
      };
      await checkResult();
    };
    class WordList {
      constructor() {
        this.words = [];
        this.memo = /* @__PURE__ */ new Map();
        this.enabled = false;
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
          if (e.target.checked) {
            this.enabled = true;
            while (this.enabled) {
              await this.pop();
              await new Promise((r) => setTimeout(r, 1e3));
            }
          } else {
            this.enabled = false;
          }
        });
        this.node.appendChild(watchInput);
        const input = document.createElement("input");
        input.addEventListener("paste", (e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text");
          const words = text.split(/\s+/);
          input.value = "";
          words.forEach((w) => this.push(w));
        });
        input.addEventListener("keydown", (e) => {
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
      async pop(item) {
        item = item || this.words.shift();
        if (!item)
          return;
        const div = this.memo.get(item);
        if (div)
          div.remove();
        return mockInput(item);
      }
      remove(item) {
        const div = this.memo.get(item);
        if (div)
          div.remove();
        this.words = this.words.filter((w) => w !== item);
        this.memo.delete(item);
        this.wordHistory.appendChild(div.cloneNode(true));
      }
      push(item) {
        if (this.memo.get(item))
          return;
        this.words.push(item);
        const div = document.createElement("div");
        div.innerText = item;
        this.memo.set(item, div);
        this.wordContainer.appendChild(div);
        div.addEventListener("click", () => this.remove(item));
      }
    }
    new WordList();
  })();
  GM_addStyle(`.word-container {  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  top: 20vh;
  right: -11rem;
  width: 12rem;
  min-height: 8rem;
  max-height: 28rem;
  border-radius: 1rem;
  padding: 1rem;
  background: var(--surface-tertiary);
  transition: ease 0.2s;
}
.word-container:hover,
.word-container:has(button:first-child.active) {
  right: 0;
}
.word-container > button:first-child {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.125rem;
  margin: 0.5rem;
  right: 0;
  top: 0;
  border-radius: 0.125rem;
  font-size: 1.2rem;
}
.word-container > button:first-child.active,
.word-container > button:first-child:hover {
  background: var(--surface-secondary);
  transition: ease 0.1s;
}
.word-container label {
  user-select: none;
}
.word-container label input {
  height: 1rem;
  width: 1rem;
  flex-shrink: 0;
  border-radius: 0.25rem;
  border: 1px solid var(--text-secondary);
  background-color: transparent;
}
.word-container input {
  outline: none !important;
  box-shadow: none !important;
  border-radius: 0.25rem;
  padding: 0.125rem;
}
.word-container input ~ div {
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  padding: 0.125rem;
  border-radius: 0.25rem;
}
.word-container input ~ div > div:not(:last-child) {
  border-bottom: 1px solid var(--surface-secondary);
  padding: 0.1rem 0;
}
.word-container input ~ div > div:hover {
  background: var(--surface-secondary);
  transition: ease 0.1s;
}
.word-container > div:last-child {
  background-color: var(--surface-secondary);
}
`);
})();
