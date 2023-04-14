const fs = require('fs');

function addToFile(newElement) {
  const existingData = JSON.parse(fs.readFileSync('exception.json'));
  existingData.push(newElement);
  fs.writeFileSync('exception.json', JSON.stringify(existingData));
}

function removeByDate(dateToRemove) {
  const existingData = JSON.parse(fs.readFileSync('exception.json'));
  const indexToRemove = existingData.findIndex(
    (element) => element.date === dateToRemove
  );
  if (indexToRemove !== -1) {
    existingData.splice(indexToRemove, 1);
  }
  fs.writeFileSync('exception.json', JSON.stringify(existingData));
}

function checkIfExists(elementToCheck) {
  const existingData = JSON.parse(fs.readFileSync('exception.json'));
  const elementExists = existingData.some(
    (element) => JSON.stringify(element) === JSON.stringify(elementToCheck)
  );
  return elementExists;
}

function removePassedEvents() {
  const existingData = JSON.parse(fs.readFileSync('exception.json'));
  const currentDate = new Date();
  const filteredData = existingData.filter(
    (element) =>
      new Date(element.date + 'T' + element.horaire.split(' - ')[0]) >
      new Date().toISOString().replace(/.\d+Z$/g, '')
  );
  fs.writeFileSync('exception.json', JSON.stringify(filteredData));
}

module.exports = {
  addToFile,
  removeByDate,
  checkIfExists,
  removePassedEvents,
};

/*
const newElement = {
  nom: 'New Event',
  date: '2023-03-01',
  horaire: '13:00:00 - 14:30:00',
};

removeByDate(newElement.date);*/
