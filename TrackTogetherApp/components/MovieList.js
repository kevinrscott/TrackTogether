import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import axios from 'axios';
import { TMDB_API_KEY, TMDB_URL } from '@env';
import Footer from './Footer';
import { auth, db } from '../config/firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const API_KEY = TMDB_API_KEY;
const BASE_URL = TMDB_URL;

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingShows, setLoadingShows] = useState(true);
  const [error, setError] = useState(null);
  const [userLists, setUserLists] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ movies: [], shows: [] });

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const movieResponse = await axios.get(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`);
        const showResponse = await axios.get(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}`);

        const moviesWithImages = movieResponse.data.results.filter((movie) => movie.poster_path);
        const showsWithImages = showResponse.data.results.filter((show) => show.poster_path);

        setMovies(moviesWithImages);
        setShows(showsWithImages);
        setLoadingMovies(false);
        setLoadingShows(false);
      } catch (error) {
        setError('Error fetching content.');
        setLoadingMovies(false);
        setLoadingShows(false);
      }
    };

    const fetchUserLists = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const listsRef = collection(db, 'users', user.uid, 'lists');
          const querySnapshot = await getDocs(listsRef);
          const lists = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          setUserLists(lists);
        }
      } catch (error) {
        setError('Error fetching user lists.');
      }
    };

    fetchItems();
    fetchUserLists();
  }, []);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleAddToList = async () => {
    if (selectedList && selectedItem) {
      try {
        const user = auth.currentUser;

        const itemData = {
          title: selectedItem.title || selectedItem.name,
          year: selectedItem.release_date || selectedItem.first_air_date,
          genre: selectedItem.genre_ids ? selectedItem.genre_ids.join(', ') : 'Unknown Genre',
          rating: selectedItem.vote_average || 'Unknown Rating',
          poster: selectedItem.poster_path || '',
          description: selectedItem.overview || 'No description available',
          createdAt: new Date(),
        };

        await addDoc(collection(db, "users", user.uid, "lists", selectedList.id, "items"), itemData);

        setModalVisible(false);
        alert("Item added to list!");
      } catch (error) {
        alert("Error adding item to list.");
        console.error(error);
      }
    } else {
      alert('Please select a valid list and item.');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults({ movies: []});
      return;
    }

    try {
      const movieResponse = await axios.get(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${searchQuery}`);
      const showResponse = await axios.get(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${searchQuery}`);

      const filteredMovies = movieResponse.data.results.filter((movie) => movie.poster_path);
      const filteredShows = showResponse.data.results.filter((show) => show.poster_path);

      setSearchResults({ movies: filteredMovies, shows: filteredShows });
    } catch (error) {
      setError('Error fetching search results.');
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    handleSearch();
  };

  if (loadingMovies || loadingShows) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for movies or shows..."
        placeholderTextColor="gray"
        value={searchQuery}
        onChangeText={handleSearchChange}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {searchQuery ? (
          <>
            <Text style={styles.header}>Search Results - Movies</Text>
            <FlatList
              data={searchResults.movies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleItemClick(item)}>
                  <View style={styles.movieCard}>
                    <Image
                      style={styles.movieImage}
                      source={{ uri: `https://image.tmdb.org/t/p/w500/${item.poster_path}` }}
                    />
                  </View>
                </TouchableOpacity>
              )}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />

            <Text style={styles.header}>Search Results - Series</Text>
            <FlatList
              data={searchResults.shows}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleItemClick(item)}>
                  <View style={styles.movieCard}>
                    <Image
                      style={styles.movieImage}
                      source={{ uri: `https://image.tmdb.org/t/p/w500/${item.poster_path}` }}
                    />
                  </View>
                </TouchableOpacity>
              )}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        ) : (
          <>
            <Text style={styles.header}>Top Rated Movies</Text>
            <FlatList
              data={movies}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleItemClick(item)}>
                  <View style={styles.movieCard}>
                    <Image
                      style={styles.movieImage}
                      source={{ uri: `https://image.tmdb.org/t/p/w500/${item.poster_path}` }}
                    />
                  </View>
                </TouchableOpacity>
              )}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />

            <Text style={styles.header}>Top Rated Series</Text>
            <FlatList
              data={shows}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleItemClick(item)}>
                  <View style={styles.movieCard}>
                    <Image
                      style={styles.movieImage}
                      source={{ uri: `https://image.tmdb.org/t/p/w500/${item.poster_path}` }}
                    />
                  </View>
                </TouchableOpacity>
              )}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        )}
      </ScrollView>

      <View style={styles.footerContainer}>
        <Footer />
      </View>

      {modalVisible && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select a List</Text>
              <FlatList
                data={userLists}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setSelectedList(item)}>
                    <Text style={styles.listItem}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddToList}>
                <Text style={styles.addButtonText}>Add to List</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#1c1c1c',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    color: 'white',
    marginBottom: 15,
    fontSize: 24,
    fontWeight: 'bold',
  },
  movieCard: {
    marginRight: 15,
    alignItems: 'center',
  },
  movieImage: {
    width: 150,
    height: 225,
    borderRadius: 5,
  },
  listContainer: {
    paddingLeft: 10,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 18,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    color: 'white',
    marginBottom: 15,
    borderRadius: 5,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#07a1b5',
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#07a1b5',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    height: '50%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'white',
  },
  listItem: {
    fontSize: 16,
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  addButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  addButtonText: {
    color: '#025f6b',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
});

export default MovieList;
