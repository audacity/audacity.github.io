const cookieStorage = {
  getItem: (key) => {
    const cookies = document.cookie
      .split(";")
      .map((cookie) => cookie.split("="))
      .reduce((acc, [key, value]) => ({ ...acc, [key.trim()]: value }), {});
    return cookies[key];
  },
  setItem: (key, value) => {
    document.cookie = `${key}=${value}; expires=${new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 365
    ).toGMTString()}`;
  },
};

const storageType = cookieStorage;
const consentPropertyName = "Audacity_consent";

const showShowPopup = () => !storageType.getItem(consentPropertyName);
const saveToStorage = () => storageType.setItem(consentPropertyName, true);

window.onload = () => {
  const consentPopup = document.getElementById("consent-popup");
  const acceptBtn = document.getElementById("accept");

  const acceptFn = (event) => {
    saveToStorage(storageType);
    consentPopup.classList.add("hide");
  };

  acceptBtn.addEventListener("click", acceptFn);

  if (showShowPopup(storageType)) {
    setTimeout(() => {
      consentPopup.classList.remove("hide");
    }, 2000);
  }
};
