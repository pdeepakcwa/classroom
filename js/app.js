/* ==========================================================
   APP CONTROLLER
   Main Application Bootstrap
========================================================== */

/* ==========================================================
   APP STATE
========================================================== */

let appReady = false;

/* ==========================================================
   STARTUP
========================================================== */

function initializeApplication() {

    console.log(
        "Starting Classroom P2P..."
    );

    setupMobileButtons();

    setupLoadButton();

    setupKeyboardShortcuts();

    setupPageUnloadWarning();

    appReady = true;

    updateSyncStatus(
        "Ready"
    );

    console.log(
        "Application Ready"
    );

}

/* ==========================================================
   STATUS
========================================================== */

function updateSyncStatus(text) {

    const el =
        document.getElementById(
            "syncStatus"
        );

    if(el){
        el.textContent = text;
    }

}

/* ==========================================================
   MOBILE BUTTONS
========================================================== */

function setupMobileButtons() {

    document
    .getElementById(
        "mobileDraw"
    )
    ?.addEventListener(
        "click",
        () => {

            if(
                typeof enableDrawMode
                === "function"
            ){
                enableDrawMode();
            }

        }
    );

    document
    .getElementById(
        "mobilePages"
    )
    ?.addEventListener(
        "click",
        () => {

            const page =
                prompt(
                    "Go to page number:"
                );

            if(!page)
                return;

            const pageNumber =
                parseInt(page);

            if(
                isNaN(pageNumber)
            ) return;

            if(
                typeof gotoPage
                === "function"
            ){

                gotoPage(
                    pageNumber - 1
                );

            }

        }
    );

    document
    .getElementById(
        "mobileHand"
    )
    ?.addEventListener(
        "click",
        () => {

            if(
                typeof raiseHand
                === "function"
            ){

                raiseHand();

            }

        }
    );

}

/* ==========================================================
   LOAD SESSION BUTTON
========================================================== */

function setupLoadButton() {

    document
    .getElementById(
        "loadBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            document
            .getElementById(
                "loadFileInput"
            )
            ?.click();

        }
    );

}

/* ==========================================================
   KEYBOARD SHORTCUTS
========================================================== */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        (event) => {

            const key =
                event.key
                    .toLowerCase();

            const ctrl =
                event.ctrlKey;

            /* Undo */

            if(
                ctrl &&
                key === "z"
            ){

                event.preventDefault();

                if(
                    typeof undoBoard
                    === "function"
                ){

                    undoBoard();

                }

            }

            /* Redo */

            if(
                ctrl &&
                key === "y"
            ){

                event.preventDefault();

                if(
                    typeof redoBoard
                    === "function"
                ){

                    redoBoard();

                }

            }

            /* Draw */

            if(
                key === "d"
            ){

                if(
                    typeof enableDrawMode
                    === "function"
                ){

                    enableDrawMode();

                }

            }

            /* Select */

            if(
                key === "s"
            ){

                if(
                    typeof enableSelectMode
                    === "function"
                ){

                    enableSelectMode();

                }

            }

            /* Next Page */

            if(
                key ===
                "arrowright"
            ){

                if(
                    typeof nextPage
                    === "function"
                ){

                    nextPage();

                }

            }

            /* Previous Page */

            if(
                key ===
                "arrowleft"
            ){

                if(
                    typeof previousPage
                    === "function"
                ){

                    previousPage();

                }

            }

        }
    );

}

/* ==========================================================
   SESSION PROTECTION
========================================================== */

function setupPageUnloadWarning() {

    window.addEventListener(
        "beforeunload",
        (event) => {

            if(!appReady)
                return;

            event.preventDefault();

            event.returnValue =
                "";

        }
    );

}

/* ==========================================================
   CONNECTION MONITOR
========================================================== */

function monitorConnection() {

    setInterval(
        () => {

            const status =
                document
                .getElementById(
                    "connectionStatus"
                );

            if(
                !status
            ) return;

            if(
                connection &&
                connection.open
            ){

                status.classList
                .remove(
                    "offline"
                );

                status.classList
                .add(
                    "online"
                );

            }
            else{

                status.classList
                .remove(
                    "online"
                );

                status.classList
                .add(
                    "offline"
                );

            }

        },
        3000
    );

}

/* ==========================================================
   AUTO SAVE
========================================================== */

function autoSaveSession() {

    setInterval(
        () => {

            try {

                if(
                    typeof exportNotebook
                    !== "function"
                ){
                    return;
                }

                const data =
                    exportNotebook();

                localStorage.setItem(

                    "classroom_autosave",

                    JSON.stringify(
                        data
                    )

                );

            }
            catch(err){

                console.error(
                    err
                );

            }

        },
        30000
    );

}

/* ==========================================================
   AUTO RESTORE
========================================================== */

function restoreAutoSave() {

    try {

        const data =
            localStorage
            .getItem(
                "classroom_autosave"
            );

        if(!data)
            return;

        const parsed =
            JSON.parse(
                data
            );

        if(
            typeof importNotebook
            === "function"
        ){

            importNotebook(
                parsed
            );

        }

    }
    catch(err){

        console.error(
            err
        );

    }

}

/* ==========================================================
   DEBUG PANEL
========================================================== */

function showDebugInfo() {

    console.log(
        "Peer:",
        peer
    );

    console.log(
        "Connection:",
        connection
    );

    console.log(
        "Notebook Pages:",
        window.notebookPages
            ?.length
    );

    console.log(
        "Current Page:",
        window.currentPage
    );

}

/* ==========================================================
   PERIODIC SAVE OF PAGE
========================================================== */

function pageSyncProtection() {

    setInterval(
        () => {

            if(
                typeof saveCurrentPage
                === "function"
            ){

                saveCurrentPage();

            }

        },
        5000
    );

}

/* ==========================================================
   APP INIT
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeApplication();

        monitorConnection();

        autoSaveSession();

        restoreAutoSave();

        pageSyncProtection();

        window.showDebugInfo =
            showDebugInfo;

        console.log(
            "Classroom Loaded"
        );

    }
);
