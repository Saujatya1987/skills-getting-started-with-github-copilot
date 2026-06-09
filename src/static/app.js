document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select to avoid duplicate options when reloading
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement('div');
        participantsSection.className = 'participants-section';
        const participantsTitle = document.createElement('h5');
        participantsTitle.textContent = 'Participants';
        participantsSection.appendChild(participantsTitle);

        const participantsListEl = document.createElement('ul');
        participantsListEl.className = 'participants-list';

        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement('li');
          li.className = 'no-participants';
          li.textContent = 'No participants yet';
          participantsListEl.appendChild(li);
        } else {
          details.participants.forEach((email) => {
            const li = document.createElement('li');
            li.className = 'participant';

            const span = document.createElement('span');
            span.className = 'participant-email';
            span.textContent = email;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'delete-participant';
            removeBtn.title = 'Unregister';
            removeBtn.setAttribute('aria-label', `Unregister ${email}`);
            removeBtn.textContent = '✖';

            removeBtn.addEventListener('click', async (e) => {
              e.stopPropagation();
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: 'DELETE' }
                );

                const resJson = await resp.json();
                if (resp.ok) {
                  li.remove();

                  // If no more participants, show placeholder
                  if (!participantsListEl.querySelector('.participant')) {
                    const none = document.createElement('li');
                    none.className = 'no-participants';
                    none.textContent = 'No participants yet';
                    participantsListEl.appendChild(none);
                  }
                } else {
                  messageDiv.textContent = resJson.detail || 'Failed to remove participant';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 5000);
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              }
            });

            li.appendChild(span);
            li.appendChild(removeBtn);
            participantsListEl.appendChild(li);
          });
        }

        participantsSection.appendChild(participantsListEl);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities so the participants list updates immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
