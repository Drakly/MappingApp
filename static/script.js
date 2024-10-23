let потребителЛокация; // Дефинираме променлива за потребителската локация
let directionsService; // Декларираме глобално променливата за Directions Service
let directionsRenderer; // Декларираме глобално directionsRenderer
let карта; // Декларираме глобално променливата за картата
let маркери = []; // Массив за маркери на паркинги
let infoWindow; // Декларираме глобално infoWindow

function initMap() {
    const софия = { lat: 42.6977, lng: 23.3219 };
    карта = new google.maps.Map(document.getElementById("map"), {
        center: софия,
        zoom: 12,
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            потребителЛокация = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            new google.maps.Marker({
                position: потребителЛокация,
                map: карта,
                title: "Вашето местоположение",
                icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                },
            });
            карта.setCenter(потребителЛокация);
        }, () => {
            handleLocationError(true, карта.getCenter());
        });
    } else {
        handleLocationError(false, карта.getCenter());
    }

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    directionsRenderer.setMap(карта);

    infoWindow = new google.maps.InfoWindow(); // Инициализация на infoWindow

    document.getElementById("search").addEventListener("click", () => {
        const radius = document.getElementById("radius").value;
        if (потребителЛокация) {
            findParkingLots(потребителЛокация, карта, radius);
        } else {
            alert('Не може да се намери текущата локация.');
        }
    });

    document.getElementById("add-parking-toggle").addEventListener("click", () => {
        const form = document.getElementById("add-parking-form");
        form.style.display = form.style.display === "none" ? "block" : "none";
    });

    document.getElementById("submit-parking").addEventListener("click", () => {
        const name = document.getElementById("parking-name").value;
        const latitude = parseFloat(document.getElementById("parking-latitude").value);
        const longitude = parseFloat(document.getElementById("parking-longitude").value);
        const openingHours = document.getElementById("parking-opening-hours").value;

        if (name && !isNaN(latitude) && !isNaN(longitude)) {
            addParkingLot(name, { lat: latitude, lng: longitude }, openingHours);
        } else {
            alert("Моля, попълнете всички полета коректно.");
        }
    });

    document.getElementById("navigate-button").addEventListener("click", () => {
        if (маркери.length > 0) {
            const destination = маркери[маркери.length - 1].getPosition(); // Използваме getPosition() за последния маркер
            getDirections(потребителЛокация, destination);
        }
    });

    document.getElementById("stop-button").addEventListener("click", () => {
        directionsRenderer.setMap(null); // Скрие указанията
    });
}

// Функция за намиране на паркинги
function findParkingLots(location, map, radius) {
    const radiusValue = parseInt(radius);
    if (isNaN(radiusValue) || radiusValue <= 0) {
        alert('Моля, въведете валиден радиус.');
        return;
    }
    const service = new google.maps.places.PlacesService(map);
    const request = {
        location: location,
        radius: radiusValue,
        type: ['parking'],
    };

    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            clearMarkers(); // Изчистваме предишните маркери
            results.forEach(parking => {
                const parkingMarker = new google.maps.Marker({
                    position: parking.geometry.location,
                    map: map,
                    title: parking.name,
                });
                parkingMarker.addListener("click", () => {
                    infoWindow.setContent(`<div><strong>${parking.name}</strong><br>${parking.vicinity || 'Няма адрес'}<br><button class="navigate-button" data-lat="${parking.geometry.location.lat()}" data-lng="${parking.geometry.location.lng()}">Навигирай</button></div>`);
                    infoWindow.open(map, parkingMarker);
                });
                маркери.push(parkingMarker); // Записваме маркера
            });
        }
    });
}

// Функция за добавяне на нов паркинг
function addParkingLot(name, location, openingHours) {
    const parkingMarker = new google.maps.Marker({
        position: location,
        map: карта,
        title: name,
    });
    маркери.push(parkingMarker); // Записваме новия маркер
    alert(`Паркинг '${name}' е добавен успешно!`);
}

// Функция за навигация
function getDirections(start, end) {
    const request = {
        origin: new google.maps.LatLng(start.lat, start.lng),
        destination: end, // end е LatLng обект
        travelMode: google.maps.TravelMode.DRIVING,
    };

    // Логваме началната и крайната точка за навигация
    console.log("Започваме навигация от:", start);
    console.log("Навигиране до:", end);

    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            document.getElementById("stop-button").style.display = "block"; // Показване на бутона за спиране
        } else {
            alert("Не може да се извърши навигация: " + status);
            console.error("Грешка при получаване на указания:", status);
        }
    });
}

// Добавяме обработчик на клик за бутона "Навигирай"
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("navigate-button")) {
        const lat = parseFloat(event.target.getAttribute("data-lat"));
        const lng = parseFloat(event.target.getAttribute("data-lng"));

        console.log("Потребителска локация:", потребителЛокация);
        console.log("Локация на паркинга:", { lat, lng });

        if (typeof потребителЛокация !== 'undefined') {
            const destination = new google.maps.LatLng(lat, lng); // Създаваме LatLng обект
            getDirections(потребителЛокация, destination);
        } else {
            alert("Не може да се извърши навигация.");
        }
    }
});

// Функция за обработка на грешки при геолокацията
function handleLocationError(browserHasGeolocation, позиция) {
    const message = browserHasGeolocation ?
        "Геолокацията не успя." :
        "Вашият браузър не поддържа геолокация.";
    alert(message);
}

// Функция за изчистване на маркерите
function clearMarkers() {
    маркери.forEach(marker => marker.setMap(null)); // Изчистване на всички маркери от картата
    маркери = []; // Изчистване на масива
}

// Инициализиране на картата
window.initMap = initMap; // Декларираме initMap глобално
