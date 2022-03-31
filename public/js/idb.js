let db;

const req = indexedDB.open('budget_tracker', 1);

req.onupgradeneeded = function (e) {
  const db = e.target.result;
  db.createObjectStore('new_entry', { autoIncrement: true });
};

req.onsuccess = function (e) {
  db = e.target.result;

  if (navigator.online) {
    uploadTransaction();
  }
};

req.onerror = function (e) {
  console.log(e.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const entryObjectStore = transaction.objectStore('new_transaction');
  entryObjectStore.add(record);
}

function uploadTransaction() {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const entryObjectStore = transaction.objectStore('new_transaction');
  const getAll = entryObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
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
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const entryObjectStore = transaction.objectStore('new_transaction');

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
