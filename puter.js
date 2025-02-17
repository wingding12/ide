document.addEventListener("DOMContentLoaded", function () {
  // Initialize Puter
  const puter = window.puter;

  // Function to handle UI updates
  function updateUI(isSignedIn) {
    const signInBtn = document.getElementById("judge0-sign-in-btn");
    const signOutBtn = document.getElementById("judge0-sign-out-btn");
    const username = document.getElementById("judge0-puter-username");

    if (signInBtn) signInBtn.style.display = isSignedIn ? "none" : "block";
    if (signOutBtn) signOutBtn.style.display = isSignedIn ? "block" : "none";

    if (isSignedIn && username) {
      puter.user.getInfo().then((info) => {
        username.textContent = info.username;
      });
    }
  }

  // Initialize Puter auth state
  if (puter) {
    // Remove any existing click handlers
    const signInBtn = document.getElementById("judge0-sign-in-btn");
    const signOutBtn = document.getElementById("judge0-sign-out-btn");

    if (signInBtn) {
      signInBtn.replaceWith(signInBtn.cloneNode(true));
      const newSignInBtn = document.getElementById("judge0-sign-in-btn");
      newSignInBtn.addEventListener("click", () => {
        puter.auth.signIn();
      });
    }

    if (signOutBtn) {
      signOutBtn.replaceWith(signOutBtn.cloneNode(true));
      const newSignOutBtn = document.getElementById("judge0-sign-out-btn");
      newSignOutBtn.addEventListener("click", () => {
        puter.auth.signOut();
      });
    }

    // Set up auth state change listener
    puter.auth.onAuthStateChanged((isSignedIn) => {
      console.log(
        "Auth state changed:",
        isSignedIn ? "signed in" : "signed out"
      );
      updateUI(isSignedIn);
    });
  } else {
    console.warn("Puter is not available");
  }
});

// Remove any global references to old functions
window.uiSignIn = undefined;
window.uiSignOut = undefined;
