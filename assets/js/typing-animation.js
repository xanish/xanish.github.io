const roles = [
  "Backend Engineer",
  "Full-stack Engineer",
  "Senior Software Engineer",
  "Senior Module Lead Engineer",
];
let currentRoleIndex = 0;
let displayedText = "";
let isDeleting = false;
let typingSpeed = 150;
let deletingSpeed = 100;
let delayBetweenRoles = 1500;

function type() {
  const currentRole = roles[currentRoleIndex];
  const textElement = document.getElementById("job-role");

  if (isDeleting) {
    displayedText = currentRole.substring(0, displayedText.length - 1);
  } else {
    displayedText = currentRole.substring(0, displayedText.length + 1);
  }

  // Update the text content, preserving the cursor
  textElement.innerHTML =
    displayedText + '<span class="blinking-cursor">_</span>';

  if (!isDeleting && displayedText === currentRole) {
    // Pause at end of typing
    setTimeout(() => {
      isDeleting = true;
    }, delayBetweenRoles);
  } else if (isDeleting && displayedText === "") {
    isDeleting = false;
    currentRoleIndex = (currentRoleIndex + 1) % roles.length;

    // Pause before typing next role
    setTimeout(type, typingSpeed);
    return;
  }

  const speed = isDeleting ? deletingSpeed : typingSpeed;
  setTimeout(type, speed);
}

// Start the animation when the page loads
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(type, typingSpeed);
});
