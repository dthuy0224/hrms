document.addEventListener("DOMContentLoaded", async function () {
  const form = document.getElementById("forgotPasswordForm");
  const messageElement = document.getElementById("message");
  const emailInput = document.getElementById("email");

  let csrfToken = "";

  // 🛠 Fetch CSRF token từ backend
  async function getCsrfToken() {
    try {
      const response = await fetch("/csrf-token", { // ✅ Đổi lại đúng endpoint
        credentials: "include", // ✅ Đảm bảo gửi cookie CSRF
      });
      const data = await response.json();
      csrfToken = data.csrfToken;
      console.log("✅ CSRF Token fetched:", csrfToken); // 🛠 Debug log
    } catch (error) {
      console.error("❌ Failed to fetch CSRF token:", error);
    }
  }

  await getCsrfToken(); // Lấy CSRF token ngay khi load trang

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      showMessage("Email cannot be empty.", "red");
      return;
    }
    if (!validateEmail(email)) {
      showMessage("Invalid email format.", "red");
      return;
    }

    await handleSubmit(email);
  });

  async function handleSubmit(email) {
    showMessage("Processing...", "blue");

    try {
      const response = await fetch("/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken, // ✅ Gửi CSRF token vào header
        },
        body: JSON.stringify({ email }),
        credentials: "include", // ✅ Gửi cookie CSRF
      });

      const data = await response.json();

      if (response.ok) {
        showMessage(data.message, "green");
      } else {
        showMessage(data.error || "Failed to send request.", "red");
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error);
      showMessage("Something went wrong. Please try again.", "red");
    }
  }

  function showMessage(text, color) {
    messageElement.textContent = text;
    messageElement.style.color = color;
    messageElement.style.fontWeight = "bold";
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+$/.test(email);
  }
});
