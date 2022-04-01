let db;

const req = indexedDB.open('budget_tracker', 1);

req.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore('pending', { autoIncrement: true });
};
req.onsuccess = ({ target }) => {
  db = target.result;
  // check if app is online before reading from db
  if (navigator.onLine) {
    uploadTransaction();
  }
};
req.onerror = function (e) {
  console.log(e.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['pending'], 'readwrite');
  const entryObjectStore = transaction.objectStore('pending');
  entryObjectStore.add(record);
}

function uploadTransaction() {
  const transaction = db.transaction(['pending'], 'readwrite');
  const entryObjectStore = transaction.objectStore('pending');
  const getAll = entryObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['pending'], 'readwrite');
          const entryObjectStore = transaction.objectStore('pending');

          entryObjectStore.clear();

          alert('Your entry has been submitted!');
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);
