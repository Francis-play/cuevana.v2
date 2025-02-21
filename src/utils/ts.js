console.time('totalExecutionTime'); // Inicia el cronómetro

const axios = require('axios');

// Función para hacer una solicitud HTTP
async function getCurlResponse(url, referer = "https://player.cuevana.is/") {
    try {
        const response = await axios.get(url, {
            headers: {
                'Referer': referer
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error en la solicitud:', error);
        return null;
    }
}

// Precompilación de expresiones regulares
const regexUrl = /var\s+url\s*=\s*'([^']+)'/;
const regexEvalContent = /(?=eval)(.*?)\|\'.../m;

// Función para extraer la URL de la respuesta
function getLinkFromResponse(response) {
    const match = regexUrl.exec(response);
    return match ? match[1] : null;
}

// Función para obtener la segunda respuesta
async function getSecondResponse(url) {
    return await getCurlResponse(url);
}

// Función para decodificar el contenido ofuscado
function EvalDecode(source) {
if (source.includes('eval')) {
    source = source.slice(source.indexOf('(') + 1, source.lastIndexOf(')'));
  }
    global._eval = global.eval;

    global.eval = (_code) => {
        global.eval = global._eval;
        return _code;
    };

    // Wrap the decoded string in a function call
    return global._eval('(' + source + ')');
}

// Función para extraer el valor de 'file' de la respuesta decodificada
function extractHLSUrl(scriptContent) {
    return scriptContent.substring(
        scriptContent.indexOf('file:"https://') + 6,
        scriptContent.indexOf('"', scriptContent.indexOf('file:"https://') + 6)
    );
}

// Función para extraer el código JavaScript ofuscado con la regex de eval
function extractEvalContent(response) {
    const match = regexEvalContent.exec(response);
    return match ? match[0] : null;
}

// Función principal para realizar todo el proceso
async function processVideo(initialUrl) {
    // Paso 1: Solicitar la URL inicial
    const response = await getCurlResponse(initialUrl);
    
    if (!response) {
        console.error("Error al obtener la respuesta inicial.");
        return;
    }

    // Paso 2: Extraer el primer enlace
    const firstLink = getLinkFromResponse(response);
    if (!firstLink) {
        console.error("No se pudo extraer el enlace de la respuesta.");
        return;
    }

    // Paso 3: Obtener la respuesta de la segunda URL
    const secondResponse = await getSecondResponse(firstLink);
    if (!secondResponse) {
        console.error("Error al obtener la segunda respuesta.");
        return;
    }

    // Paso 4: Extraer el contenido que está ofuscado y contiene 'eval'
    const evalContent = extractEvalContent(secondResponse);
    if (!evalContent) {
        console.error("No se pudo extraer el contenido ofuscado.");
        return;
    }

    // Paso 5: Decodificar el contenido ofuscado con EvalDecode
    const decodedContent = EvalDecode(evalContent);
    if (!decodedContent) {
        console.error("Error al decodificar el contenido.");
        return;
    }

    // Paso 6: Extraer el valor de 'file' de la respuesta decodificada
    const fileUrl = extractHLSUrl(decodedContent);
    if (!fileUrl) {
        console.error("No se pudo extraer el enlace del archivo.");
        return;
    }

    // Imprimir o retornar el resultado final
    console.log("URL del video: " + fileUrl);
}

// Llamada a la función con una URL de ejemplo
processVideo("https://player.cuevana.is/player.php?h=rxPRsRSX4IlkyS1F21W5jxY_M_ZvO7GNpWVE3HFimxPlR5mWNJICl96GkbGMkXCk");

console.timeEnd('totalExecutionTime'); // Detiene el cronómetro y muestra el tiempo


