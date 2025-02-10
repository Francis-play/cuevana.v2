const express = require('express');
const { getMovies, getSeries, getDetail, getByGenre, getByActor, getSearch, getLinks, getDownload, getTrailer } = require('./api');

const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Endpoint para obtener películas
app.get('/movies', async (req, res) => {
  const { type, page } = req.query;  // Parámetros enviados en la query
  try {
    const movies = await getMovies(parseInt(type), page);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo películas' });
  }
});

// Endpoint para obtener series
app.get('/series', async (req, res) => {
  const { type } = req.query;  // Parámetro enviado en la query
  try {
    const series = await getSeries(parseInt(type));
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo series' });
  }
});

// Endpoint para obtener detalle de un ID
app.get('/detail/:id/:episode?', async (req, res) => {
  const { id, episode } = req.params;  // ID enviado en la URL, episode (opcional)
  try {
    const detail = episode ? await getDetail(id, episode) : await getDetail(id);
    res.json(detail);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo detalle' });
  }
});

// Endpoint para buscar por género
app.get('/genre', async (req, res) => {
  const { type, page } = req.query;  // Parámetros enviados en la query
  try {
    const genreMovies = await getByGenre(parseInt(type), page);
    res.json(genreMovies);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo películas por género' });
  }
});

// Endpoint para buscar por actor
app.get('/actor/:id', async (req, res) => {
  const { id } = req.params;  // ID del actor enviado en la URL
  const { page } = req.query;  // Parámetro opcional en la query
  try {
    const actorMovies = await getByActor(id, page);
    res.json(actorMovies);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo películas por actor' });
  }
});

// Endpoint para buscar por términos
app.get('/search', async (req, res) => {
  const { query, page } = req.query;  // Parámetros enviados en la query
  try {
    const searchResults = await getSearch(query, page);
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
});

// Endpoint para obtener links
app.get('/links/:id', async (req, res) => {
  const { id } = req.params;  // ID enviado en la URL
  try {
    const links = await getLinks(id);
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo links' });
  }
});

// Endpoint para obtener descarga
app.get('/download/:id/:episode?', async (req, res) => {
  const { id, episode } = req.params;  // ID enviado en la URL, episode (opcional)
  try {
    const downloadLinks = episode ? await getDownload(id, episode) : await getDownload(id);
    res.json(downloadLinks);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo links de descarga' });
  }
});

// Endpoint para obtener trailer
app.get('/trailer/:id', async (req, res) => {
  const { id } = req.params;  // ID enviado en la URL
  try {
    const trailer = await getTrailer(id);
    res.json(trailer);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo trailer' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
