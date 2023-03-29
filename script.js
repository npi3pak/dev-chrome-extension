const button = document.querySelector("button");
const input = document.querySelector("input");

function main() {
  chrome.windows.getCurrent((w) => {
    chrome.tabs.query({ active: true, windowId: w.id }, (tabs) => {
      var tab = tabs[0];
      const tabLink = new URL(tab.url);

      const selectedTaskId = tabLink.searchParams.get("selectedIssue");
      const openedTaskId = parseOpenedTaskId(tabLink.pathname);

      const taskIdValue = selectedTaskId || openedTaskId;

      if (taskIdValue) {
        fillTextInput(taskIdValue);
      }
    });
  });
}

function fillTextInput(text) {
  input.value = text;
  input.select();
  navigator?.clipboard.writeText(input.value);
}

function parseOpenedTaskId(pathname = "") {
  const pathList = pathname.split("/");

  if (pathList[1] === "browse" && pathList.length === 3) {
    return pathList[2];
  }

  return undefined;
}

button.addEventListener("click", async () => {
  await main();
});

window.onload = main();
