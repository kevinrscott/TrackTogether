import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import axios from "axios";
import { TMDB_API_KEY, TMDB_URL, GAME_API_KEY, GAME_URL } from "@env";
import Footer from "./Footer";
import { auth, db } from "../config/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { useListContext } from "../contexts/ListContext";

const API_KEY = TMDB_API_KEY;
const BASE_URL = TMDB_URL;
const GAME_API = GAME_API_KEY;

const MovieList = () => {
  const { contentList, loading, refreshLists } = useListContext();

  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingShows, setLoadingShows] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedList, setSelectedList] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ movies: [], shows: [] });
  const [confirmedSearch, setConfirmedSearch] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const movieResponse = await axios.get(
          `${BASE_URL}/movie/top_rated?api_key=${API_KEY}`
        );
        const showResponse = await axios.get(
          `${BASE_URL}/tv/top_rated?api_key=${API_KEY}`
        );
        const gameResponse = await axios.get(
          `${GAME_URL}?key=${GAME_API}&=-added&page_size=10`
        )

        const moviesWithImages = movieResponse.data.results.filter(
          (movie) => movie.poster_path
        );
        const showsWithImages = showResponse.data.results.filter(
          (show) => show.poster_path
        );

        setMovies(moviesWithImages);
        setShows(showsWithImages);
        setGames(gameResponse.data.results);
        setLoadingGames(false);
        setLoadingMovies(false);
        setLoadingShows(false);
      } catch (error) {
        setError("Error fetching content lala.");
        setLoadingGames(false);
        setLoadingMovies(false);
        setLoadingShows(false);
      }
    };

    fetchItems();
  }, []);

  const handleItemClick = (item) => {
    setSelectedItem(item);
    refreshLists();
    setModalVisible(true);
  };

  const handleAddToList = async () => {
    if (selectedList && selectedItem) {
      try {
        
        let type = "Unkown";
        if (selectedItem.release_date) {
          type = "Movie";
        } else if (selectedItem.first_air_date) {
          type = "Show";
        } else if (selectedItem.released) {
          type = "Game";
        }

        const itemData = {
          title: selectedItem.title || selectedItem.name,
          year: selectedItem.release_date || selectedItem.first_air_date || selectedItem.released,
          rating: selectedItem.vote_average || "Unknown Rating",
          description: selectedItem.overview || "No description available",
          createdAt: new Date(),
          type: type,
        };

        await addDoc(
          collection(db, "lists", selectedList.id, "items"),
          itemData
        );

        setModalVisible(false);
        alert("Item added to list!");
      } catch (error) {
        alert("Error adding item to list.");
        console.error(error);
      }
    } else {
      alert("Please select a valid list and item.");
    }
  };

  useEffect(() => {
    const runSearch = async () => {
      if (!confirmedSearch.trim()) {
        setSearchResults({ movies: [], shows: [], games: [] });
        return;
      }
  
      try {
        const movieResponse = await axios.get(
          `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${confirmedSearch}`
        );
        const showResponse = await axios.get(
          `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${confirmedSearch}`
        );
        const gameResponse = await axios.get(
          `${GAME_URL}?key=${GAME_API}&search=${confirmedSearch}`
        );
  
        const filteredMovies = movieResponse.data.results.filter(
          (movie) => movie.poster_path
        );
        const filteredShows = showResponse.data.results.filter(
          (show) => show.poster_path
        );
  
        setSearchResults({
          movies: filteredMovies,
          shows: filteredShows,
          games: gameResponse.data.results,
        });
      } catch (error) {
        setError("Error fetching search results.");
      }
    };
  
    runSearch();
  }, [confirmedSearch]);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  if (loadingMovies || loadingShows || loadingGames) {
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
        <Footer />
      </View>
    );
  }

  const handleRender = (title, data) => {
    return (
      <View>
        <Text style={styles.header}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleItemClick(item)}>
              <View style={styles.movieCard}>
                <Image
                  style={styles.movieImage}
                  source={{
                    uri:
                      item.poster_path
                      ? `https://image.tmdb.org/t/p/w500/${item.poster_path}`
                      : item.background_image || "https://via.placeholder.com/150x225?text=No+Image",
                  }}
                />
              </View>
            </TouchableOpacity>
          )}
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for movies or shows..."
        placeholderTextColor="gray"
        value={searchQuery}
        onChangeText={handleSearchChange}
        onSubmitEditing={() => setConfirmedSearch(searchQuery)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {searchQuery ? (
          <>
          {searchResults.movies?.length > 0 &&
            handleRender("Search Results - Movies", searchResults.movies)}
        
          {searchResults.shows?.length > 0 &&
            handleRender("Search Results - Series", searchResults.shows)}
        
          {searchResults.games?.length > 0 &&
            handleRender("Search Results - Games", searchResults.games)}
        </>
        ) : (
          <>
            {handleRender("Top Rated Movies", movies)}

            {handleRender("Top Rated Series", shows)}

            {handleRender("Popular Video Games", games)}
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
                data={contentList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedList(item)}
                    style={[
                      styles.listItem,
                      selectedList && selectedList.id === item.id
                        ? styles.listItemSelected
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.listItemText,
                        selectedList && selectedList.id === item.id
                          ? styles.listItemTextSelected
                          : null,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                style={styles.modalListContainer}
              />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddToList}
                  disabled={!selectedList || !selectedItem}
                >
                  <Text style={styles.addButtonText}>Add to List</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: "#1c1c1c",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    color: "white",
    marginBottom: 15,
    fontSize: 24,
    fontWeight: "bold",
  },
  movieCard: {
    marginRight: 15,
    alignItems: "center",
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
    color: "red",
    textAlign: "center",
    fontSize: 18,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    color: "white",
    marginBottom: 15,
    borderRadius: 5,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#07a1b5",
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  modalListContainer: {
    width: "100%",
    maxHeight: 250,
    marginBottom: 10,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: "#eee",
    borderRadius: 5,
    marginBottom: 5,
  },
  listItemSelected: {
    backgroundColor: "#07a1b5",
  },
  listItemText: {
    fontSize: 16,
    color: "#333",
  },
  listItemTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalButtonContainer: {
    width: "100%",
    marginTop: 10,
  },
  addButton: {
    backgroundColor: "#07a1b5",
    paddingVertical: 12,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ddd",
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
  },
});

export default MovieList;
