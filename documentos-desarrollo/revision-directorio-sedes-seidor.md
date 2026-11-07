# Revisión del directorio público de sedes SEIDOR

Fecha de contraste: 2026-11-07.

Fuente de direcciones: https://www.seidor.com/en-be/our-offices. El fichero revisado es `src/config/seidor-offices.json` del árbol de trabajo, que contiene cambios locales en curso.

Las 78 denominaciones del fichero aparecen en el directorio oficial y las palabras significativas de las direcciones locales aparecen en sus respectivas fichas, tras normalizar acentos y puntuación. Es una comparación automatizada de cobertura y palabras, no una verificación carácter por carácter ni una confirmación de que la sede siga operativa.

El 2026-11-07 el usuario facilitó una lista de direcciones. La ficha de Dubái que proporcionó difiere de la página del directorio consultada: se ha actualizado la dirección local con su información. La comparación automatizada anterior se hizo antes de ese cambio; el marcador de Dubái sigue siendo aproximado a escala de ciudad.

**Ninguna coordenada se considera verificada a nivel de edificio.** Las 78 sedes conservan precisión `city`, que la interfaz presenta como centro aproximado; las coordenadas representan una ciudad/localidad o quedan pendientes cuando la fuente disponible solo resuelve el complejo, una dirección virtual o un topónimo ambiguo. Cada fila de la tabla deja constancia de ese límite. Esto no confirma ocupación de edificio ni vigencia operativa. No se exige un punto exacto de edificio para visualizar el directorio público.

Se comprobó la contención geométrica de los 78 puntos contra el polígono del país declarado en `public/data/countries.geojson`: 70 quedan dentro y ocho fuera: Beirut, Cape Town, Dubai, Las Palmas, Palma de Mallorca, Port Louis, San Juan y Santander. Esta prueba solo detecta desajustes con esa geometría de mapa; no demuestra que el punto sea incorrecto ni que esté en el mar. Se marcaron para revisión, sin moverlos a ciegas, porque faltan coordenadas validadas de localidad/sede o una fuente que explique el borde simplificado.

Casos que requieren atención por localidad indicada en la dirección: Lisboa (Algés), Miami (Doral), Pamplona (Cordovilla), Heredia (Santa Rosa de Santo Domingo), Dubái (Al Quoz 3) y Panamá, cuya ficha dice «Centro virtual». Kerala figura en Koratty. Se corrigieron cuatro marcadores al centro de la localidad indicada y se mantuvo `coordinatePrecision: "city"`: Miami/Doral (GeoNames), Lisboa/Algés (Getty TGN), Heredia/Santa Rosa (GeoNames) y Pamplona/Cordovilla (coordenada publicada para el núcleo de Cordovilla por SoloPueblos). Fuentes consultadas el 2026-11-07: [Doral, GeoNames](https://www.geonames.org/4153471/doral.html), [Algés, Getty Thesaurus of Geographic Names](https://www.getty.edu/vow/TGNFullDisplay?english=N&find=&nation=&place=religious+center&subjectid=1049673), [Santa Rosa, GeoNames](https://www.geonames.org/advanced-search.html?country=CR&q=Heredia&startRow=50), [Cordovilla, Ayuntamiento de Galar](https://www.cendeadegalar.es/pueblos-de-la-cendea/cordovilla/) y [coordenada del núcleo de Cordovilla, SoloPueblos](https://solopueblos.net/comunidad-foral-de-navarra/navarra/cordovilla.html). Las fuentes de topónimo no geocodifican el edificio de SEIDOR; las coordenadas son representativas de localidad y no de sede.

En Miami, el directorio inmobiliario consultado sitúa la dirección 3105 NW 107th Ave dentro de Doral aproximadamente en 25.80285, -80.36784. El marcador ahora usa el centro poblado de Doral (25.81954, -80.35533), no ese candidato parcelario; tampoco se afirma que SEIDOR ocupe el inmueble señalado por el directorio inmobiliario.

| Sede en el directorio | Localidad que figura en el fichero | Precisión declarada | Estado y motivo |
| --- | --- | --- | --- |
| Barcelona (Headquarters) | Barcelona | city | Aproximada: centro de localidad; edificio pendiente |
| Madrid | Madrid | city | Aproximada: centro de localidad; edificio pendiente |
| Valencia | Valencia | city | Aproximada: centro de localidad; edificio pendiente |
| Sevilla | Sevilla | city | Aproximada: centro de localidad; edificio pendiente |
| Bilbao | Bilbao | city | Aproximada: centro de localidad; edificio pendiente |
| A Coruña | A Coruña | city | Aproximada: centro de localidad; edificio pendiente |
| Almería | Almería | city | Aproximada: centro de localidad; edificio pendiente |
| Asuncion | Asuncion | city | Aproximada: centro de localidad; edificio pendiente |
| Beaumont-lès-Valence | Beaumont-lès-Valence | city | Aproximada: centro de localidad; edificio pendiente |
| Beirut | Beirut | city | Revisar: punto fuera del polígono LB; sin corrección por falta de fuente |
| Belo Horizonte | Belo Horizonte | city | Aproximada: centro de localidad; edificio pendiente |
| Bogotá | Bogotá | city | Aproximada: centro de localidad; edificio pendiente |
| Bolivia | Santa Cruz de la Sierra | city | Aproximada: centro de localidad; edificio pendiente |
| Bologna | Mordano | city | Aproximada: centro de localidad; edificio pendiente |
| Brussels | Brussels | city | Aproximada: centro de localidad; edificio pendiente |
| Buenos Aires | Buenos Aires | city | Aproximada: centro de localidad; edificio pendiente |
| Cairo | Cairo | city | Aproximada: centro de localidad; edificio pendiente |
| Cape Town | Cape Town | city | Revisar: punto fuera del polígono ZA; sin corrección por falta de fuente |
| Cartagena | Cartagena | city | Aproximada: centro de localidad; edificio pendiente |
| Casablanca | Casablanca | city | Aproximada: centro de localidad; edificio pendiente |
| Ciudad de Guatemala | Guatemala City | city | Aproximada: centro de localidad; edificio pendiente |
| Concorezzo | Concorezzo | city | Aproximada: centro de localidad; edificio pendiente |
| Curitiba | Curitiba | city | Aproximada: centro de localidad; edificio pendiente |
| Dar es Salaam | Dar es Salaam | city | Aproximada: centro de localidad; edificio pendiente |
| Doha | Doha | city | Aproximada: centro de localidad; edificio pendiente |
| Dubai | Dubai | city | Revisar: punto fuera del polígono AE y dirección en Al Quoz 3; sin centro validado |
| Dublin | Dublin | city | Aproximada: centro de localidad; edificio pendiente |
| El Salvador | San Salvador | city | Aproximada: centro de localidad; edificio pendiente |
| Estado de México | Huixquilucan | city | Aproximada: centro de localidad; edificio pendiente |
| Goiânia | Goiânia | city | Aproximada: centro de localidad; edificio pendiente |
| Götenborg | Gothenburg | city | Aproximada: centro de localidad; edificio pendiente |
| Granada | Armilla | city | Aproximada: centro de localidad; edificio pendiente |
| Halmstad | Halmstad | city | Aproximada: centro de localidad; edificio pendiente |
| Heredia | Santa Rosa, Santo Domingo | city | Aproximada: centro de localidad; edificio pendiente |
| Houston | The Woodlands | city | Aproximada: centro de localidad; edificio pendiente |
| Johannesburg | Johannesburg | city | Aproximada: centro de localidad; edificio pendiente |
| Kerala | Koratty | city | Aproximada: centro de localidad; edificio pendiente |
| Kuwait City | Kuwait City | city | Aproximada: centro de localidad; edificio pendiente |
| Las Palmas | Las Palmas de Gran Canaria | city | Revisar: punto fuera del polígono ES; sin corrección por falta de fuente |
| León | León | city | Aproximada: centro de localidad; edificio pendiente |
| Lisboa | Algés | city | Aproximada: centro de localidad; edificio pendiente |
| London | Weybridge | city | Aproximada: centro de localidad; edificio pendiente |
| Lusaka | Lusaka | city | Aproximada: centro de localidad; edificio pendiente |
| Málaga | Málaga | city | Aproximada: centro de localidad; edificio pendiente |
| Miami | Doral | city | Aproximada: centro de localidad; edificio pendiente |
| Montevideo | Montevideo | city | Aproximada: centro de localidad; edificio pendiente |
| Murcia | Murcia | city | Aproximada: centro de localidad; edificio pendiente |
| Nairobi | Nairobi | city | Aproximada: centro de localidad; edificio pendiente |
| Oviedo | Oviedo | city | Aproximada: centro de localidad; edificio pendiente |
| Palma de Mallorca | Palma | city | Revisar: punto fuera del polígono ES; sin corrección por falta de fuente |
| Pamplona | Cordovilla | city | Aproximada: centro de localidad; edificio pendiente |
| Panamá | Panama City | city | Aproximada: ciudad; dirección indicada como virtual |
| Petaj Tikva | Petah Tiqva | city | Aproximada: centro de localidad; edificio pendiente |
| Port Louis | Port Louis | city | Revisar: punto fuera del polígono MU; sin corrección por falta de fuente |
| Porto Alegre | Porto Alegre | city | Aproximada: centro de localidad; edificio pendiente |
| Quito | Quito | city | Aproximada: centro de localidad; edificio pendiente |
| Recife | Recife | city | Aproximada: centro de localidad; edificio pendiente |
| Ribeirão Preto | Ribeirão Preto | city | Aproximada: centro de localidad; edificio pendiente |
| Rio de Janeiro | Rio de Janeiro | city | Aproximada: centro de localidad; edificio pendiente |
| Riyadh | Riyadh | city | Aproximada: centro de localidad; edificio pendiente |
| Roma | Roma | city | Aproximada: centro de localidad; edificio pendiente |
| San Borja | San Borja | city | Aproximada: centro de localidad; edificio pendiente |
| San Juan | San Juan | city | Revisar: punto fuera del polígono PR; sin corrección por falta de fuente |
| San Pedro Sula | San Pedro Sula | city | Aproximada: centro de localidad; edificio pendiente |
| San Sebastián | San Sebastián | city | Aproximada: centro de localidad; edificio pendiente |
| Santander | Santander | city | Revisar: punto fuera del polígono ES; sin corrección por falta de fuente |
| Santiago de Chile | Santiago | city | Aproximada: centro de localidad; edificio pendiente |
| Santo Domingo | Santo Domingo | city | Aproximada: centro de localidad; edificio pendiente |
| São Paulo | São Paulo | city | Aproximada: centro de localidad; edificio pendiente |
| Shangai | Shanghai | city | Aproximada: centro de localidad; edificio pendiente |
| Surco | Santiago de Surco | city | Aproximada: centro de localidad; edificio pendiente |
| Taichung City | Taichung | city | Aproximada: centro de localidad; edificio pendiente |
| Tunis | Tunis | city | Aproximada: centro de localidad; edificio pendiente |
| Vic | Vic | city | Aproximada: centro de localidad; edificio pendiente |
| Vigo | Vigo | city | Aproximada: centro de localidad; edificio pendiente |
| Vitória | Vitória | city | Aproximada: centro de localidad; edificio pendiente |
| Vitoria Gasteiz | Gasteiz / Vitoria | city | Aproximada: centro de localidad; edificio pendiente |
| Zaragoza | Zaragoza | city | Aproximada: centro de localidad; edificio pendiente |
