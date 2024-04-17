// Contents of script.js

document.addEventListener('DOMContentLoaded', function() {
    const bodyClass = document.body.classList;
    if (bodyClass.contains('home-page')) {
        document.getElementById('navHome').classList.add('active');
    } else if (bodyClass.contains('options-page')) {
        document.getElementById('navOptions').classList.add('active');
    }
});


let currentEventId = null;
let currentMaterial = null;
let currentEmployeeCount = 1;
let eventType = null;
let Störungsart = null;
let Anlage = null;
let Fehler = null;


document.addEventListener('DOMContentLoaded', function() {
  const employeeModal = new bootstrap.Modal(document.getElementById('employeeModal'), {
    backdrop: 'static', // Prevent closing by clicking outside of the modal
    keyboard: false // Optional: prevents closing the modal with the keyboard
  });
  employeeModal.show();
});

function submitEmployeeCount() {
  currentEmployeeCount = document.getElementById('employeeCount').value;
  if (currentEmployeeCount && currentEmployeeCount > 0) { // Ensure a positive number is entered
    console.log("Number of Employees: ", currentEmployeeCount);
    // Optionally send this to the server
    // fetch('/api/employee-count', { method: 'POST', body: JSON.stringify({ count }), headers: { 'Content-Type': 'application/json' }});

    // Close modal after valid submission
    const employeeModal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
    employeeModal.hide();
  } else {
    // Alert or indicate to the user that the input is required
    alert("Bitte geben Sie eine zulässige Nummer ein.");
  }
}

function reportEventToBackend(Störungsart, eventType, Anlage = null, Fehler = null) {
    var currentMaterial = document.getElementById('materialSelection').value;
    const postData = {
        material: currentMaterial,
        employeeCount: currentEmployeeCount,
        Störungsart: Störungsart,
        eventType: eventType,
    };
    if (Anlage) postData.Anlage = Anlage;
    if (Fehler) postData.Fehler = Fehler;  // Include Fehler if available
    if (currentEventId) postData.event_id = currentEventId; // Include the event ID if updating an existing event

    fetch('/report_event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            console.log("Event reported successfully with event ID:", data.event_id);
            // Reset currentEventId here if Fehler is part of the update
            if (Fehler) {
                currentEventId = null;
                console.log("Fehler added and currentEventId reset.");
            }
            // If creating a new event, update currentEventId to reference the newly created event
            if (!currentEventId) {
                currentEventId = data.event_id;
            }
        } else {
            console.error("Failed to report event:", data);
        }
    })
    .catch(error => console.error('Error reporting event:', error));
}

function reportPauseToBackend(eventType) {
    var currentMaterial = document.getElementById('materialSelection').value;
    const postData = {
        material: currentMaterial,
        employeeCount: currentEmployeeCount,
        eventType: eventType
    };

    fetch('/report_pause_event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            console.log("Pause event reported successfully with event ID:", data.event_id);
            // Handle any additional logic here, such as UI updates or notifications
        } else {
            console.error("Failed to report pause event:", data);
        }
    })
    .catch(error => console.error('Error reporting pause event:', error));
}

let lastUpdatedCounter = 'Ohne TF'; // Default to 'Ohne TF' or set based on initial state

function updateCounter(action, subcategory) {
    var currentMaterial = document.getElementById('materialSelection').value;
    // Update the last updated counter based on the subcategory
    lastUpdatedCounter = subcategory;
    fetch('/update_counter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: action,
            subcategory: subcategory,
            material: currentMaterial, // Include currentMaterial in the request body
        }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);

        // Determine which counter value to use based on the last updated counter
        const maxValue = 100; // Your maximum value
        let currentLevel;
        if (lastUpdatedCounter === 'Ohne TF') {
            currentLevel = data.counterVortexOhne; // Assuming this is returned from the backend

            document.querySelector('.counter').textContent = data.counterVortexOhne;
            document.querySelector('.counter-label').textContent = 'Vortex ohne TF:';
            document.querySelector('.current-product').textContent = 'Vortex ohne TF';
        } else {
            currentLevel = data.counterVortexMit; // Assuming this is returned from the backend

            document.querySelector('.counter').textContent = data.counterVortexMit;
            document.querySelector('.counter-label').textContent = 'Vortex mit TF:';
            document.querySelector('.current-product').textContent = 'Vortex mit TF';
        }

        // Update progress bar
        const percentageHeight = (currentLevel / maxValue) * 100;
        const progressBar = document.querySelector('.progress-bar');
        progressBar.style.height = `${percentageHeight}%`;

////         Optionally, update the progress bar text or data attribute
//        progressBar.textContent = `${currentLevel}`;
//        progressBar.setAttribute('aria-valuenow', currentLevel);

        // Update current level text
        document.querySelector('.current-percentage').textContent = currentLevel;

        document.getElementById('deltaST').textContent = data.deltaST;

        // Update the color based on the value
        if (data.deltaST <= 0) {
            document.getElementById('elapsedTimeDisplay').style.color = '#D50C2F';
        } else {
            document.getElementById('elapsedTimeDisplay').style.color = '#54A931';
        }
        })
    .catch(error => console.error('Error:', error));
}



document.addEventListener('DOMContentLoaded', () => {
    updateEmployeeCount(currentEmployeeCount);
    document.getElementById('numberEmployees').value = currentEmployeeCount;
    const quantityInput = document.querySelector('.quantity');

    document.querySelector('.minus').addEventListener('click', () => {
        quantityInput.stepDown();
        updateEmployeeCount(quantityInput.value);
    });

    document.querySelector('.plus').addEventListener('click', () => {
        quantityInput.stepUp();
        updateEmployeeCount(quantityInput.value);
    });
});

function updateEmployeeCount(newCount) {
    currentEmployeeCount = parseInt(newCount, 10);
    // Optionally, trigger a 'change' event on the input if other parts of your app need it
    const event = new Event('change');
    document.querySelector('.quantity').dispatchEvent(event);
}

document.querySelector('.quantity').addEventListener('change', function() {
    currentEmployeeCount = this.value;
});

document.querySelectorAll('.number-input button').forEach(button => {
    button.addEventListener('click', () => {
        // Wait for the input update to complete
        setTimeout(() => {
            currentEmployeeCount = document.querySelector('.quantity').value;
        }, 0);
    });
});

// Section 2 -----------------------------------------------------------------------------------------------------

// This is only for displaying the right values when starting the app
document.addEventListener('DOMContentLoaded', function() {
    fetch('/get_counter_vortex_ohne')
    .then(response => response.json())
    .then(data => {
        // Assuming your progress bar's maximum value is set and known
        const maxValue = 100; // This should match your Flask route's maxCounterValue
        const currentLevel = data.counterVortexOhne;
        const percentageHeight = (currentLevel / maxValue) * 100;

        // Set the height of your progress bar
        const progressBar = document.querySelector('.progress-bar');
        progressBar.style.height = `${percentageHeight}%`;

        document.querySelector('.max-percentage').textContent = `${maxValue}`;

//        // Optionally, update the text or data attribute for display
//        progressBar.textContent = `${currentLevel}`; // Or any format you prefer
//        progressBar.setAttribute('aria-valuenow', currentLevel); // Reflect current level

//        // Update current level text
//        document.querySelector('.current-percentage').textContent = currentLevel;

    })
    .catch(error => console.error('Error fetching counter data:', error));
});



// Section 3 ------------------------------------------------------------------------------------------------------

function setTimerIcon(action) {
    if (action == 'resume') document.getElementById('timerStatus').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/></svg>';
    else if (action == 'pause') document.getElementById('timerStatus').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0z"/></svg>';
}


let timerRunning = false;
let pauseSource = null; // Tracks the source of the pause action

document.addEventListener('DOMContentLoaded', () => {
    // Assign event listener to the pause button (stopButton1) for pausing and resuming the timer
    document.getElementById('stopButton1').addEventListener('click', () => {
        if (timerRunning) {
                timerRunning = false;
                pauseSource = "stopButton1"
                reportPauseToBackend('pause');
                setTimerIcon('pause');
            } else if (pauseSource === "stopButton1"){
                timerRunning = true;
                reportPauseToBackend('resume');
                setTimerIcon('resume')
            }
        document.querySelector('.section3').classList.toggle('pause-mode');
    });

    // Assign event listener to the "Störung" button (stopButton2) to show error buttons
    document.getElementById('stopButton2').addEventListener('click', () => {
    let storungButton = document.getElementById('stopButton2');

    currentEventId = null;

    if (!timerRunning) {
        // Check if the text is something other than "Störung" (meaning an error was selected)
        if (storungButton.textContent !== "Störung") {
            if (storungButton.textContent === 'Anlage Störung') {
                // Resume Timer, reset button label to Storung;
                timerRunning = true;
                if (Fehler) reportEventToBackend(storungButton.textContent, 'resume', Anlage, Fehler);
                else reportEventToBackend(storungButton.textContent, 'resume', Anlage); // Send resume event
                toggleErrorButtons(false);
                storungButton.textContent = "Störung";
                setTimerIcon('resume')
                document.querySelector('.section3').classList.toggle('defect-mode');
            }
            else {
                timerRunning = true;
                reportEventToBackend(storungButton.textContent, 'resume'); // Send resume event
                toggleErrorButtons(false);
                storungButton.textContent = "Störung";
                setTimerIcon('resume')
                document.querySelector('.section3').classList.toggle('defect-mode');
            }
        }
    }
    else {
        toggleErrorButtons(true);
        timerRunning = false;
        pauseSource = "stopButton2"
        setTimerIcon('pause');
        document.querySelector('.section3').classList.toggle('defect-mode');
    }
    });

    // Event listeners for each error button
    document.querySelectorAll('.error-buttons button').forEach(button => {
        button.addEventListener('click', (e) => {
            Störungsart = e.target.textContent; // Get the text from the clicked button
            eventType = 'pause';
            reportEventToBackend(Störungsart, eventType);

//            pauseSource = "stopButton2"
            updateStorungButton(Störungsart); // Update "Störung" button text with the clicked button's text
            toggleErrorButtons(false); // Hide error buttons
        });
    });
    const anlageStorungButton = document.getElementById('Anlage Störung');
    const selectionWindow = document.querySelector('.selection-window');

    anlageStorungButton.addEventListener('click', function() {
        // Assuming /get_selection_options fetches parent options
        fetch('/get_selection_options')
            .then(response => response.json())
            .then(options => {
                selectionWindow.innerHTML = ''; // Clear previous options

                options.forEach(option => {
                    const button = document.createElement('button');
                    button.classList.add('selection-option', 'btn', 'btn-primary', 'mb-2');
                    button.textContent = option.label;
                    button.addEventListener('click', () => {
                    Anlage = option.label;
                    reportEventToBackend(Störungsart, eventType, Anlage);
                    handleParentOptionSelection(option.id);
                    });

                    selectionWindow.appendChild(button);
                });

                selectionWindow.style.display = 'block';
            })
            .catch(error => console.error('Failed to load selection options:', error));
    });

//    // Optionally, hide the selection window when clicking outside of it
//    window.addEventListener('click', function(event) {
//        if (!selectionWindow.contains(event.target) && event.target !== anlageStorungButton) {
//            selectionWindow.style.display = 'none';
//        }
//    });

});

function updateStorungButton(text) {
    let storungButton = document.getElementById('stopButton2');
    storungButton.textContent = text; // Update text
    storungButton.style.display = 'block'; // Ensure it's visible
}

function toggleErrorButtons(show) {
    let storungButton = document.getElementById('stopButton2');
    let errorButtons = document.querySelectorAll('.error-buttons button');

    if (show) {
        storungButton.style.display = 'none'; // Hide "Störung" button
        errorButtons.forEach(button => button.style.display = 'block'); // Show error buttons
    } else {
        // When hiding, revert "Störung" button text to its original state if needed
        // storungButton.textContent = "Störung"; // Uncomment if you want to revert the text back
        errorButtons.forEach(button => button.style.display = 'none'); // Hide error buttons
    }
}


function handleParentOptionSelection(parentOptionId) {
    const selectionWindow = document.querySelector('.selection-window');
    // Fetch child options for the selected parent option
    fetch(`/get_child_selection_options/${parentOptionId}`)
        .then(response => response.json())
        .then(childOptions => {
            selectionWindow.innerHTML = ''; // Clear previous options

            // Check if there are any child options
            if (childOptions.length != 0) {
                childOptions.forEach(option => {
                    const button = document.createElement('button');
                    button.classList.add('child-option', 'btn', 'btn-secondary', 'mb-2'); // Different styling for child options
                    button.textContent = option.label;
                    button.addEventListener('click', () => {
                        Fehler = button.textContent;
                        console.log("Reporting with Fehler:", Fehler);
                        reportEventToBackend(Störungsart, eventType, Anlage, Fehler);
                        handleChildOptionSelection(option.id, option.label);
                    });
                    selectionWindow.appendChild(button);
                });
            }
            else {
                console.log("No child options available for this parent option.");
                selectionWindow.style.display = 'none';
            }

            // No need to show the selection window again, it's already visible
        })
        .catch(error => console.error('Failed to load child options:', error));
}


function handleChildOptionSelection(childOptionId, childOptionLabel) {
    console.log(`Selected child option ID: ${childOptionId}, Label: ${childOptionLabel}`);
    // Here, implement what happens after a child option is selected
    // This could involve hiding the selection window, updating UI elements,
    // or sending data to the backend
    const selectionWindow = document.querySelector('.selection-window');
    selectionWindow.style.display = 'none'; // Optionally hide the selection window
}


// Initialize the timer display and start the timer
window.onload = function() {
    timerRunning = true;
};


/* Section 4 ------------------------------------------------------------------------------------------------ */

// Attach event listeners to +1 / -1 buttons
    document.getElementById('increaseCounterButton').addEventListener('click', function() {
    document.getElementById('increaseModal').style.display = "block";
});

document.getElementById('decreaseCounterButton').addEventListener('click', function() {
    document.getElementById('decreaseModal').style.display = "block";
});

// Attach event listeners for subcategory buttons
document.getElementById('increaseButton1').addEventListener('click', function() {
    updateCounter('increase','Mit TF');
    document.getElementById('increaseModal').style.display = "none"; // Hide the modal
});
document.getElementById('increaseButton2').addEventListener('click', function() {
    updateCounter('increase','Ohne TF');
    document.getElementById('increaseModal').style.display = "none"; // Hide the modal
});

document.getElementById('decreaseButton1').addEventListener('click', function() {
    updateCounter('decrease','Mit TF');
    document.getElementById('decreaseModal').style.display = "none"; // Hide the modal
});
document.getElementById('decreaseButton2').addEventListener('click', function() {
    updateCounter('decrease','Ohne TF');
    document.getElementById('decreaseModal').style.display = "none"; // Hide the modal
});

window.onclick = function(event) {
    var increaseModal = document.getElementById('increaseModal');
    var decreaseModal = document.getElementById('decreaseModal');
    if (event.target == increaseModal) {
        increaseModal.style.display = "none";
    } else if (event.target == decreaseModal) {
        decreaseModal.style.display = "none";
    }
}


