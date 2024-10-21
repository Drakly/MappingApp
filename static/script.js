let потребителЛокация; // Дефинираме променлива за потребителската локация
let directionsService; // Декларираме глобално променливата за Directions Service
let directionsRenderer; // Декларираме глобално directionsRenderer

function initMap() {
    const софия = { lat: 42.6977, lng: 23.3219 };
    const карта = new google.maps.Map(document.getElementById("map"), {
        center: софия,
        zoom: 12,
    });

    let currentParkingLocation; // Локацията на текущия паркинг
    let markers = []; // Глобален масив за съхранение на маркерите

    // Проверка за текущата локация на потребителя
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            потребителЛокация = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            // Добавяне на маркер за текущото местоположение
            new google.maps.Marker({
                position: потребителЛокация,
                map: карта,
                title: "Вашето местоположение",
                icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                },
            });

            карта.setCenter(потребителЛокация); // Центриране на картата на потребителската локация
        }, () => {
            handleLocationError(true, карта.getCenter());
        });
    } else {
        handleLocationError(false, карта.getCenter());
    }

    // Инициализация на Directions Service и Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // Не показвай стандартните маркери
    });
    directionsRenderer.setMap(карта);

    // Добавяне на бутон "Стоп"
    const stopButton = document.createElement("button");
    stopButton.innerText = "Стоп";
    stopButton.style.position = "absolute";
    stopButton.style.top = "10px";
    stopButton.style.right = "10px";
    stopButton.style.zIndex = "1000";
    карта.controls[google.maps.ControlPosition.TOP_RIGHT].push(stopButton);

    stopButton.addEventListener("click", () => {
        directionsRenderer.setMap(null); // Скрива маршрута
        directionsRenderer.setDirections({}); // Изчистване на текущите указания
    });

    function findParkingLots(location, map, radius) {
        const radiusValue = parseInt(radius); // Преобразуваме радиуса в число

        if (isNaN(radiusValue) || radiusValue <= 0) {
            alert('Моля, въведете валиден радиус.');
            return; // Спира изпълнението, ако радиусът не е валиден
        }

        const service = new google.maps.places.PlacesService(map);
        const request = {
            location: location,
            radius: radiusValue, // Използване на зададения радиус
            type: ['parking'],
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                results.forEach(parking => {
                    const маркер = new google.maps.Marker({
                        position: parking.geometry.location,
                        map: map,
                        title: parking.name,
                    });

                    // Записване на локацията на паркинга
                    currentParkingLocation = {
                        lat: parking.geometry.location.lat(),
                        lng: parking.geometry.location.lng(),
                    };

                    // Извличане на информация за детайли на паркинга
                    const detailsRequest = {
                        placeId: parking.place_id,
                    };

                    service.getDetails(detailsRequest, (details, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            const работноВреме = details.opening_hours ? 
                                `<p>Работно време: ${details.opening_hours.weekday_text.join('<br>')}</p>` : 
                                '<p>Работно време: Няма информация</p>';
                            const рейтинг = details.rating ? 
                                `<p>Рейтинг: ${details.rating} (${details.user_ratings_total} оценки)</p>` : 
                                '<p>Рейтинг: Няма информация</p>';

                            const инфоПрозорец = new google.maps.InfoWindow({
                                content: `
                                    <h3>${parking.name}</h3>
                                    ${работноВреме}
                                    ${рейтинг}
                                    <button class="navigate-button" data-lat="${currentParkingLocation.lat}" data-lng="${currentParkingLocation.lng}">Навигирай</button>
                                `,
                            });

                            маркер.addListener("click", () => {
                                инфоПрозорец.open(map, маркер);
                            });

                            markers.push(маркер); // Добавяме маркера в масива
                        }
                    });
                });
            }
        });
    }

    // Функция за изчистване на маркерите
    function clearMarkers() {
        markers.forEach(marker => marker.setMap(null)); // Премахва всеки маркер от картата
        markers = []; // Изчиства масива
    }

    // Функция за обработка на грешки при геолокацията
    function handleLocationError(browserHasGeolocation, позиция) {
        const message = browserHasGeolocation ?
            "Геолокацията не успя." :
            "Вашият браузър не поддържа геолокация.";
        alert(message);
    }

    // Обработчик на събитието за бутона
    document.getElementById("search").addEventListener("click", () => {
        const radius = document.getElementById("radius").value; // Получаване на радиуса от инпут полето
        console.log("Локация:", карта.getCenter()); // Проверка на локацията
        console.log("Радиус:", radius); // Проверка на радиуса

        if (потребителЛокация) { // Проверка дали потребителската локация е зададена
            clearMarkers(); // Изчиства маркерите преди новото търсене
            findParkingLots(потребителЛокация, карта, radius); // Извикване на функцията с текущата локация
        } else {
            alert('Не може да се намери текущата локация.');
        }
    });
}

document.addEventListener("click", (event) => {
    if (event.target.classList.contains("navigate-button")) {
        const lat = parseFloat(event.target.getAttribute("data-lat"));
        const lng = parseFloat(event.target.getAttribute("data-lng"));

        console.log("Потребителска локация:", потребителЛокация); // Проверка на потребителската локация
        console.log("Локация на паркинга:", { lat, lng }); // Проверка на локацията на паркинга

        if (typeof потребителЛокация !== 'undefined') {
            getDirections(потребителЛокация, { lat, lng });
        } else {
            alert("Не може да се извърши навигация.");
        }
    }
});

// Функцията за навигация
function getDirections(startLocation, endLocation) {
    console.log("Навигация от:", startLocation, "до:", endLocation); // Дебъг информация

    if (startLocation && endLocation) {
        const request = {
            origin: new google.maps.LatLng(startLocation.lat, startLocation.lng),
            destination: new google.maps.LatLng(endLocation.lat, endLocation.lng),
            travelMode: google.maps.TravelMode.DRIVING,
        };

        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result); // Показва маршрута
            } else {
                alert("Не може да се извърши навигация.");
            }
        });
    }
}
