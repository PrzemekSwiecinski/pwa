// Ten skrypt rejestruje Service Workera

// Sprawdzamy, czy przeglądarka wspiera Service Workery
if ('serviceWorker' in navigator) {
  
  // Czekamy na załadowanie całej strony, aby nie blokować renderowania
  window.addEventListener('load', () => {
    
    // Rejestrujemy plik sw.js jako Service Worker
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        // Rejestracja się powiodła
        console.log('Service Worker zarejestrowany pomyślnie. Zakres:', registration.scope);
      })
      .catch((error) => {
        // Rejestracja się nie powiodła
        console.error('Rejestracja Service Workera nie powiodła się:', error);
      });
  });

  // Prosty wskaźnik online/offline (odwołuje się do <p id="offline-status"> w HTML)
  const offlineStatus = document.getElementById('offline-status');
  
  function updateOnlineStatus() {
    if (navigator.onLine) {
      offlineStatus.textContent = "Jesteś online.";
      offlineStatus.style.color = "green";
    } else {
      offlineStatus.textContent = "Jesteś offline.";
      offlineStatus.style.color = "red";
    }
  }

  // Nasłuchujemy na zmiany statusu sieci
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Sprawdzamy status od razu przy ładowaniu strony
  updateOnlineStatus(); 
  
} else {
  // Komunikat dla starych przeglądarek
  console.warn('Przeglądarka nie wspiera Service Workerów.');
}