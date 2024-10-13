function initMap() {
    const софия = { lat: 42.6977, lng: 23.3219 };
    const карта = new google.maps.Map(document.getElementById("map"), {
        center: софия,
        zoom: 12,
    });

    let потребителЛокация;
    let маркери = []; // Масив за съхранение на маркерите

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

    function findParkingLots(location, map, radius) {
        const radiusValue = parseInt(radius);

        const service = new google.maps.places.PlacesService(map);
        const request = {
            location: location,
            radius: radiusValue,
            type: ['parking'],
        };

        // Изчистване на предишните маркери
        маркери.forEach(marker => {
            marker.setMap(null); // Премахване на маркера от картата
        });
        маркери = []; // Изчистване на масива

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                if (results.length === 0) {
                    alert('Не намерихме паркинги в зададения радиус.');
                    return;
                }

                results.forEach(parking => {
                    const маркер = new google.maps.Marker({
                        position: parking.geometry.location,
                        map: map,
                        title: parking.name,
                    });

                    // Запазване на маркера в масива
                    маркери.push(маркер);

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
                        }
                    });
                });
            }
        });
    }

    function handleLocationError(browserHasGeolocation, позиция) {
        const message = browserHasGeolocation ?
            "Геолокацията не успя." :
            "Вашият браузър не поддържа геолокация.";
        alert(message);
    }

    document.getElementById("search").addEventListener("click", () => {
        const radius = document.getElementById("radius").value;

        if (потребителЛокация) {
            findParkingLots(потребителЛокация, карта, radius);
        } else {
            alert('Не може да се намери текущата локация.');
        }
    });
}
