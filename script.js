const copyIssueButton = document.getElementById("copy-issue-id");
const prepareMRButton = document.getElementById("prepare-mr");
const copyGitCmd = document.getElementById("copy-git-cmd");
const inputIssue = document.getElementById("issue-name");
const inputGitCmd = document.getElementById("git-cmd");
const inputBranch = document.getElementById("target-branch-name");

let CURRENT_TARGET_BRANCH;

function main() {
    CURRENT_TARGET_BRANCH = localStorage.getItem("CURRENT_TARGET_BRANCH");

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

            inputBranch.value = CURRENT_TARGET_BRANCH;
        });
    });
}

function fillTextInput(text) {
    inputIssue.value = text;
    inputGitCmd.value = `git checkout -b ${text} ${CURRENT_TARGET_BRANCH}`;
}

function copyIssueNameClick() {
    inputIssue.select();
    navigator?.clipboard.writeText(inputIssue.value);
}

function copyGitCmdClick() {
    inputGitCmd.select();
    navigator?.clipboard.writeText(inputGitCmd.value);
}

function parseOpenedTaskId(pathname = "") {
    const pathList = pathname.split("/");

    if (pathList[1] === "browse" && pathList.length === 3) {
        return pathList[2];
    }

    return undefined;
}

function modifyMRDOM() {
    const sourceBranch = document.querySelector(
        ".merge-request-form > div > div > span > code"
    ).innerText;

    const title = document.querySelector("#merge_request_title").value;

    document.querySelector(
        "#merge_request_title"
    ).value = `[${sourceBranch}] ${title}`;

    document.getElementById(
        "merge_request_force_remove_source_branch"
    ).checked = true;
    document.getElementById("merge_request_squash").checked = true;
}

function prepareMR() {
    chrome.windows.getCurrent((w) => {
        chrome.tabs.query({ active: true, windowId: w.id }, (tabs) => {
            var tab = tabs[0];
            const tabLink = new URL(tab.url);

            const sourceBranch = tabLink.searchParams.get(
                "merge_request[source_branch]"
            );

            if (sourceBranch) {
                const targetBranchName = inputBranch.value;
                chrome.tabs
                    .update(tab.id, {
                        url: `${tab.url}&merge_request%5Btarget_branch%5D=${targetBranchName}`,
                    })
                    .then(() => {
                        chrome.tabs.onUpdated.addListener(function (
                            tabId,
                            info
                        ) {
                            console.log(tabId, info);
                            if (
                                tabId === tab.id &&
                                info.status === "complete"
                            ) {
                                chrome.scripting.executeScript({
                                    target: { tabId },
                                    func: modifyMRDOM,
                                });
                            }
                        });
                    });
            }
        });
    });
}

copyIssueButton.addEventListener("click", async () => {
    await copyIssueNameClick();
});

prepareMRButton.addEventListener("click", async () => {
    await prepareMR();
});

copyGitCmd.addEventListener("click", async () => {
    await copyGitCmdClick();
});

inputBranch.addEventListener("change", async () => {
    localStorage.setItem("CURRENT_TARGET_BRANCH", inputBranch.value);
});

window.onload = main();
