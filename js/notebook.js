/* ==========================================================
   NOTEBOOK ENGINE
   Multi Page Whiteboard
========================================================== */

window.notebookPages = [];
window.currentPage = 0;

/* ==========================================================
   INIT
========================================================== */

function initNotebook() {

    if (window.notebookPages.length === 0) {

        window.notebookPages.push({
            name: "Page 1",
            canvas: null
        });

    }

    updatePageDisplay();

    console.log("Notebook Ready");
}

/* ==========================================================
   PAGE DISPLAY
========================================================== */

function updatePageDisplay() {

    const pageNumber =
        document.getElementById(
            "pageNumber"
        );

    if (pageNumber) {

        pageNumber.textContent =
            window.currentPage + 1;

    }

}

/* ==========================================================
   SAVE CURRENT PAGE
========================================================== */

function saveCurrentPage() {

    if (
        !window.boardCanvas ||
        !window.notebookPages[
            window.currentPage
        ]
    ) {
        return;
    }

    window.notebookPages[
        window.currentPage
    ].canvas =
        JSON.stringify(
            boardCanvas.toJSON()
        );

}

/* ==========================================================
   LOAD CURRENT PAGE
========================================================== */

function loadCurrentPage() {

    if (
        !window.notebookPages[
            window.currentPage
        ]
    ) return;

    const page =
        window.notebookPages[
            window.currentPage
        ];

    if (!page.canvas) {

        boardCanvas.clear();

        boardCanvas.backgroundColor =
            "#ffffff";

        boardCanvas.renderAll();

        saveState();

        updatePageDisplay();

        return;
    }

    isRemoteUpdate = true;

    boardCanvas.loadFromJSON(
        page.canvas,
        () => {

            boardCanvas.renderAll();

            isRemoteUpdate = false;

            saveState();

            updatePageDisplay();

        }
    );

}

/* ==========================================================
   NEW PAGE
========================================================== */

function createNewPage() {

    saveCurrentPage();

    const nextNumber =
        window.notebookPages.length + 1;

    window.notebookPages.push({

        name:
        "Page " + nextNumber,

        canvas: null

    });

    window.currentPage =
        window.notebookPages.length - 1;

    boardCanvas.clear();

    boardCanvas.backgroundColor =
        "#ffffff";

    boardCanvas.renderAll();

    saveState();

    updatePageDisplay();

    broadcastNotebookPage();

}

/* ==========================================================
   NEXT PAGE
========================================================== */

function nextPage() {

    if (
        window.currentPage >=
        window.notebookPages.length - 1
    ) return;

    saveCurrentPage();

    window.currentPage++;

    loadCurrentPage();

    broadcastNotebookPage();

}

/* ==========================================================
   PREVIOUS PAGE
========================================================== */

function previousPage() {

    if (
        window.currentPage <= 0
    ) return;

    saveCurrentPage();

    window.currentPage--;

    loadCurrentPage();

    broadcastNotebookPage();

}

/* ==========================================================
   GOTO PAGE
========================================================== */

function gotoPage(index) {

    if (
        index < 0 ||
        index >=
        window.notebookPages.length
    ) return;

    saveCurrentPage();

    window.currentPage = index;

    loadCurrentPage();

    broadcastNotebookPage();

}

/* ==========================================================
   RECEIVE PAGE SYNC
========================================================== */

function receiveNotebookPage(data) {

    if (
        typeof data.pageIndex ===
        "undefined"
    ) return;

    while (
        window.notebookPages.length <=
        data.pageIndex
    ) {

        window.notebookPages.push({
            name:
            "Page " +
            (
                window.notebookPages
                .length + 1
            ),
            canvas: null
        });

    }

    window.currentPage =
        data.pageIndex;

    if (data.canvas) {

        window.notebookPages[
            data.pageIndex
        ].canvas =
            data.canvas;

    }

    loadCurrentPage();

}

/* ==========================================================
   PAGE SYNC
========================================================== */

function broadcastNotebookPage() {

    if (
        typeof sendWhiteboardData !==
        "function"
    ) return;

    saveCurrentPage();

    sendWhiteboardData({

        type:
        "page-sync",

        pageIndex:
        window.currentPage,

        canvas:
        window.notebookPages[
            window.currentPage
        ].canvas

    });

}

/* ==========================================================
   PAGE LIST
========================================================== */

function getPageList() {

    return window.notebookPages.map(
        (page, index) => {

            return {

                index,

                name: page.name

            };

        }
    );

}

/* ==========================================================
   RENAME PAGE
========================================================== */

function renamePage(
    index,
    newName
) {

    if (
        !window.notebookPages[index]
    ) return;

    window.notebookPages[index]
        .name = newName;

}

/* ==========================================================
   DELETE PAGE
========================================================== */

function deletePage(index) {

    if (
        window.notebookPages.length <= 1
    ) {

        alert(
            "Notebook must have at least one page."
        );

        return;

    }

    window.notebookPages.splice(
        index,
        1
    );

    if (
        window.currentPage >=
        window.notebookPages.length
    ) {

        window.currentPage =
            window.notebookPages.length - 1;

    }

    loadCurrentPage();

    updatePageDisplay();

}

/* ==========================================================
   EXPORT NOTEBOOK
========================================================== */

function exportNotebook() {

    saveCurrentPage();

    const notebookData = {

        pages:
        window.notebookPages,

        currentPage:
        window.currentPage,

        created:
        new Date()
            .toISOString()

    };

    return notebookData;

}

/* ==========================================================
   IMPORT NOTEBOOK
========================================================== */

function importNotebook(data) {

    if (
        !data ||
        !data.pages
    ) return;

    window.notebookPages =
        data.pages;

    window.currentPage =
        data.currentPage || 0;

    loadCurrentPage();

    updatePageDisplay();

}

/* ==========================================================
   AUTO SAVE PAGE
========================================================== */

function autoSaveNotebook() {

    saveCurrentPage();

}

setInterval(
    autoSaveNotebook,
    5000
);

/* ==========================================================
   EVENTS
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initNotebook();

        document
        .getElementById(
            "newPageBtn"
        )
        ?.addEventListener(
            "click",
            createNewPage
        );

        document
        .getElementById(
            "prevPageBtn"
        )
        ?.addEventListener(
            "click",
            previousPage
        );

        document
        .getElementById(
            "nextPageBtn"
        )
        ?.addEventListener(
            "click",
            nextPage
        );

    }
);
