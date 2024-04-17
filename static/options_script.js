// Script for options.html

document.addEventListener('DOMContentLoaded', function() {
    const bodyClass = document.body.classList;
    if (bodyClass.contains("home-page")) document.getElementById('navHome').classList.add('active');
    else if (bodyClass.contains("vortex-page")) document.getElementById('navVortex').classList.add('active');
    else if (bodyClass.contains("options-page")) document.getElementById('navOptions').classList.add('active');
});


document.addEventListener('DOMContentLoaded', function() {
    // Example for adding an event listener to options
    document.querySelectorAll('.option-button').forEach(button => {
        button.addEventListener('click', function() {
            const optionId = button.getAttribute('data-option-id');
            fetch(`/get_selection_options/${optionId}`)
                .then(response => response.json())
                .then(details => {
                    const detailsList = document.getElementById('detailOptionsList');
                    detailsList.innerHTML = ''; // Clear existing details
                    details.forEach(detail => {
                        const li = document.createElement('li');
                        li.classList.add('list-group-item');
                        li.textContent = detail.detail_label;
                        // Add more logic as needed, e.g., event listeners for selecting a detail
                        detailsList.appendChild(li);
                    });
                    // Show the modal or detail selection UI
                    const detailModal = new bootstrap.Modal(document.getElementById('detailModal'), {});
                    detailModal.show();
                })
                .catch(error => console.error('Failed to load selection option details:', error));
        });
    });
});


document.addEventListener('DOMContentLoaded', () => {
    // Add Detail button for adding a new child option
    document.querySelectorAll('.addDetailButton').forEach(button => {
        button.addEventListener('click', function() {
            // Set the parent option ID in the hidden input of the modal
            const parentOptionId = this.getAttribute('data-option-id');
            document.getElementById('parentOptionId').value = parentOptionId;
        });
    });

    const addChildOptionForm = document.getElementById('addChildOptionForm');
    addChildOptionForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const childLabel = document.getElementById('childOptionLabel').value;
        const parentOptionId = document.getElementById('parentOptionId').value;

        fetch('/add_child_option', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                child_label: childLabel,
                parent_id: parentOptionId,
            }),
        })
        .then(response => response.json())
        .then(data => {
            const childOptionsList = document.getElementById(`child-options-${parentOptionId}`);
            const newChildLi = document.createElement('li');
            newChildLi.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            newChildLi.innerHTML = `
                ${data.child_label}
                <button type="button" class="btn btn-danger btn-sm deleteChildButton" data-child-id="${data.id}">Delete</button>
            `;

            childOptionsList.appendChild(newChildLi);

            document.getElementById('childOptionLabel').value = '';
            bootstrap.Modal.getInstance(document.getElementById('addChildOptionModal')).hide();

            // Add an event listener to the newly added delete button.
            newChildLi.querySelector('.deleteChildButton').addEventListener('click', function() {
                // Your code to handle child option deletion, similar to existing deleteChildOption function
                const childId = this.getAttribute('data-child-id');
                fetch(`/vortex/options/delete_child/${childId}`, { method: 'POST' })
                    .then(response => {
                        if (response.ok) {
                            newChildLi.remove(); // Remove the child option element from the DOM
                        } else {
                            alert('Failed to delete child option');
                        }
                    })
                    .catch(error => console.error('Error deleting child option:', error));
            });
        })
        .catch(error => console.error('Error adding child option:', error));
    });

    // Set autofocus for adding new child option
    const addChildOptionModal = document.getElementById('addChildOptionModal');
    addChildOptionModal.addEventListener('shown.bs.modal', function () {
        document.getElementById('childOptionLabel').focus();
    });

    // Delete button for child option
    document.querySelectorAll('.deleteChildButton').forEach(button => {
        button.addEventListener('click', function() {
            const childId = this.getAttribute('data-child-id');
            fetch(`/vortex/options/delete_child/${childId}`, { method: 'POST' })
                .then(response => {
                    if (response.ok) {
                        // Remove the child option from the DOM
                        this.parentElement.remove();
                    } else {
                        alert('Failed to delete child option');
                    }
                })
                .catch(error => console.error('Error deleting child option:', error));
        });
    });
});


