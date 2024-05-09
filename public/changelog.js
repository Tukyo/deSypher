document.addEventListener("DOMContentLoaded", function () {
    // Fetch the changelog data from the JSON file
    fetch('changelog.json')
        .then(response => response.json())
        .then(data => {
            // Iterate over each changelog version and populate the corresponding div
            for (const version in data) {
                const changelogDiv = document.getElementById(`ver-${version}`);
                if (changelogDiv) {
                    const changes = data[version];
                    changes.forEach(change => {
                        const changePara = document.createElement('p');
                        changePara.textContent = change;
                        changelogDiv.appendChild(changePara);
                    });
                }
            }
        })
        .catch(error => console.error('Error loading changelog data:', error));
});
