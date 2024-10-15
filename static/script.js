function initMap() {
    const софия = { lat: 42.6977, lng: 23.3219 };
    const карта = new google.maps.Map(document.getElementById("map"), {
        center: софия,
        zoom: 12,
    });

    let потребителЛокация; // Дефинираме променлива за потребителската локация
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
        markers = []; // Изчистване на масива
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



document.getElementById("add-parking-toggle").addEventListener("click", () => {
    const form = document.getElementById("add-parking-form");
    form.style.display = form.style.display === "none" ? "block" : "none"; // Показва или скрива формата
});

// Обработчик за добавяне на нов паркинг
document.getElementById("submit-parking").addEventListener("click", () => {
    const name = document.getElementById("parking-name").value;
    const latitude = document.getElementById("parking-latitude").value;
    const longitude = document.getElementById("parking-longitude").value;
    const openingHours = document.getElementById("parking-opening-hours").value;

    // Изпраща POST заявка за добавяне на нов паркинг
    fetch('/api/parkings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            opening_hours: openingHours,
        }),
    })
    .then(response => {
        if (response.ok) {
            alert('Паркингът е добавен успешно!');
            // Можеш да изчистиш формата, ако желаеш
            document.getElementById("add-parking-form").reset();
        } else {
            alert('Грешка при добавяне на паркинга.');
        }
    });
});


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('static/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Грешка при кеширане:', error);
            })
    );
});

let deferredPrompt;
const installButton = document.getElementById('install-button');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block'; // Покажи бутона за инсталиране
});



document.addEventListener('DOMContentLoaded', () => {
    const installButton = document.getElementById('installButton');
    if (installButton) { // Увери се, че инсталационният бутон съществува
        installButton.addEventListener('click', () => {
            // Тук добави кода за инсталиране на приложението
            installButton.style.display = 'none'; // Скрий бутона за инсталиране
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('Потребителят е приел инсталирането');
        } else {
            console.log('Потребителят е отказал инсталирането');
        }
        deferredPrompt = null;
    });
            console.log('Инсталиране на приложението...');
        });
    } else {
        console.error('Инсталационният бутон не беше намерен.');
    }
});

