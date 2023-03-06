const store = new Vuex.Store({
  state: {
    lists: [],
    access_token: localStorage.getItem("access_token") || null,
    refresh_token: localStorage.getItem("refresh_token") || null,
  },
  mutations: {
    setLists(state, lists) {
      // modify dates in cards of each list to be in the format hh:mm AM/PM on dd/mm/yyyy
      state.lists = lists;
    },
    setAccessToken(state, access_token) {
      state.access_token = access_token;
    },
    setRefreshToken(state, refresh_token) {
      state.refresh_token = refresh_token;
    },
  },
  actions: {
    async login({ commit }, { username, password }) {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        commit("setAccessToken", data.access_token);
        commit("setRefreshToken", data.refresh_token);
        router.push("/board");
      }
    },
    async signup({ commit }, { username, email, password }) {
      const response = await fetch("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        commit("setAccessToken", data.access_token);
        commit("setRefreshToken", data.refresh_token);
        router.push("/");
      }
    },
    async logout({ commit }) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      commit("setAccessToken", null);
      commit("setRefreshToken", null);
      router.push("/login");
    },
    async checkAccessToken({ commit }) {
      const response = await fetch("/active", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${store.state.access_token}`,
        },
      });
      const data = await response.json();
      // check response code 
      if (response.status === 200) {
        return true;
      }
      if (data.msg == "Token has expired") {
        const refresh_response = await fetch("/refresh", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${store.state.refresh_token}`,
          },
        });
        const refresh_data = await refresh_response.json();
        console.log(refresh_data);
        if (refresh_data.access_token) {
          console.log("refreshed");
          localStorage.setItem("access_token", refresh_data.access_token);
          localStorage.setItem("refresh_token", refresh_data.refresh_token);
          commit("setAccessToken", refresh_data.access_token);
          commit("setRefreshToken", refresh_data.refresh_token);
          return true;
        }
        else {
        console.log("logout");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        commit("setAccessToken", null);
        commit("setRefreshToken", null);
        router.push("/login");
        return false;
        }
      }
      else alert("Something went wrong");
    },
    async loadLists({ commit }) {
      const response = await fetch("/api/v1/list/allLists" , {
        headers: {
          Authorization: `Bearer ${store.state.access_token}`, 
        },
      });
      const lists = await response.json();
      lists.forEach((list) => {
        list.cards.forEach((card) => {
          card.deadline = new Date(card.deadline).toLocaleString();
          card.created_at = new Date(card.created_at).toLocaleString();
          card.updated_at = new Date(card.updated_at).toLocaleString();
        });
      });
      commit("setLists", lists);
    },
    async loadCards({ commit }) {
      const response = await fetch("/api/cards");
      const cards = await response.json();
      commit("setCards", cards);
    },
    async createList({ commit }, { list_name }) {
      
      if (list_name == "") {
        const error = document.getElementById("list-add-error");
        error.innerHTML = "List name cannot be empty";
        // remove message after 5 seconds
        setTimeout(() => {
          error.innerHTML = "";
        }
        , 5000);
        return;
      }

        const response = await fetch("/api/v1/list/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
        body: JSON.stringify({
          "name": list_name,
        }),
      });
      const data = await response.json();
      if (response.status == 200) {
        commit("setLists", [...store.state.lists, data]);
        const success = document.getElementById("list-add-success");
        success.innerHTML = "List Added Successfully";
        setTimeout(() => { success.innerHTML = ""; }, 5000);
        const add_list_button = document.getElementById("add-list-button");
        add_list_button.style.display = "inline";
        const add_list_form = document.getElementById("add-list-content");
        add_list_form.style.display = "none";
      }
      if (response.status == 400) {
        const error = document.getElementById("list-add-error");
        error.innerHTML = data.message;
        // remove message after 5 seconds
        setTimeout(() => {
          error.innerHTML = "";
        }
        , 5000); 
      }
    },
    async editList({ commit }, { list_id, list_name }) {
      const response = await fetch("/api/v1/list/update/"+ list_id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
        body: JSON.stringify({
          "name": list_name,
        }),
      });
      const data = await response.json();
      if (response.status == 200) {
        const lists = store.state.lists;
        const index = lists.findIndex((list) => list.id == list_id);
        lists[index].name = list_name;
        commit("setLists", lists);
        alert ("List Edited Successfully");
      }
      if (response.status == 400) {
        alert (data.message);
      }
    },
    async deleteList({ commit }, { list_id }) {
      const response = await fetch("/api/v1/list/delete/"+ list_id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
      });
      const data = await response.json();
      if (response.status == 200) {
        commit("setLists", store.state.lists.filter((list) => list.id != list_id));
        const success = document.getElementById("general-success");
        success.innerHTML = "List Deleted Successfully";
        alert("List Deleted Successfully");
        setTimeout(() => { success.innerHTML = ""; }, 5000);
      }
      if (response.status == 400) {
        const error = document.getElementById("general-error");
        error.innerHTML = data.message;
        setTimeout(() => { error.innerHTML = ""; }, 5000);
      }
    },
    async createCard({ commit }, { card_name, list_id, card_description, deadline }) {
      const add_card_button = document.getElementById("add-card-button-"+list_id);
      add_card_button.style.display = "block";
      const add_card_form = document.getElementById("add-card-content-"+list_id);
      add_card_form.style.display = "none";

      if (card_name == "") {
        const error = document.getElementById("card-add-error");
        error.innerHTML = "Card name cannot be empty";
        setTimeout(() => { error.innerHTML = "";}, 5000);
        return;
      }
      console.log(deadline)
      const response = await fetch("/api/v1/card/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
        body: JSON.stringify({
          "name": card_name,
          "list_id": list_id,
          "description": card_description,
          "deadline": deadline,
        }),
      });
      const data = await response.json();
      if (response.status == 200) {
        const modified_lists = store.state.lists.map((list) => {
          if (list.id == list_id) {
            // modify date 
            data.deadline = new Date(data.deadline).toLocaleString();
            data.created_at = new Date(data.created_at).toLocaleString();
            data.updated_at = new Date(data.updated_at).toLocaleString();
            list.cards.push(data);
          }
          return list;
        });
        commit("setLists", modified_lists);
        const success = document.getElementById("card-add-success");
        success.innerHTML = "Card Added Successfully";
        setTimeout(() => { success.innerHTML = ""; }, 5000);
      }
      if (response.status == 400) {
        const error = document.getElementById("card-add-error");
        error.innerHTML = data.message;
        setTimeout(() => { error.innerHTML = ""; } , 5000);
      }
    },
    async editCard({ commit }, { card_id, card_name, card_description, deadline }) {
      console.log(deadline)
      const response = await fetch("/api/v1/card/update/"+ card_id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
        body: JSON.stringify({
          "name": card_name,
          "description": card_description,
          "deadline": deadline,
        }),
      });
      const data = await response.json();
      if (response.status == 200) {
        const modified_lists = store.state.lists.map((list) => {
          const index = list.cards.findIndex((card) => card.id == card_id);
          if (index != -1) {
            list.cards[index].name = card_name;
            list.cards[index].description = card_description;
            list.cards[index].deadline = new Date(deadline).toLocaleString();
          }
          return list;
        });
        commit("setLists", modified_lists);
        const success = document.getElementById("card-success");
        success.innerHTML = "Card Edited Successfully";
        setTimeout(() => { success.innerHTML = ""; }, 5000);
      }
      if (response.status == 400) {
        const error = document.getElementById("card-error");
        error.innerHTML = data.message;
        setTimeout(() => { error.innerHTML = ""; }, 5000);
      }
    },
    async moveCard({ commit }, { card_id, list_id, new_list_id }) {
      const response = await fetch("/api/v1/card/move/"+ card_id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
        body: JSON.stringify({
          "old_list": list_id,
          "new_list": new_list_id,
        }),
      });
      const data = await response.json();
      if (response.status == 200) {
        const modified_lists = store.state.lists.map((list) => {
          if (list.id == list_id) {
            list.cards = list.cards.filter((card) => card.id != card_id);
          }
          if (list.id == new_list_id) {
            list.cards.push(data);
          }
          return list;
        });
        commit("setLists", modified_lists);
        const success = document.getElementById("general-success");
        success.innerHTML = "Card Moved Successfully";
        setTimeout(() => { success.innerHTML = ""; }, 5000);
      }
      if (response.status == 400) {
        const error = document.getElementById("general-error");
        error.innerHTML = data.message;
        setTimeout(() => { error.innerHTML = ""; }, 5000);
      }
    },
    async deleteCard({ commit }, { card_id, list_id }) {
      const response = await fetch("/api/v1/card/delete/"+ card_id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
      });
      const data = await response.json();
      if (response.status == 200) {
        const modified_lists = store.state.lists.map((list) => {
          if (list.id == list_id) {
            list.cards = list.cards.filter((card) => card.id != card_id);
          }
          return list;
        });
        commit("setLists", modified_lists);
        const success = document.getElementById("general-success");
        success.innerHTML = "Card Deleted Successfully";
        setTimeout(() => { success.innerHTML = ""; }, 5000);
      }
      if (response.status == 400) {
        const error = document.getElementById("general-error");
        error.innerHTML = data.message;
        setTimeout(() => { error.innerHTML = ""; }, 5000);
      }
    },
    async markCard({ commit }, { card_id, list_id }) {
      const response = await fetch("/api/v1/card/complete/"+ card_id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
      });
      const data = await response.json();
      if (response.status == 200) {
        const modified_lists = store.state.lists.map((list) => {
          const index = list.cards.findIndex((card) => card.id == card_id);
          if (index != -1) {
            list.cards[index].status = "Completed";
            list.cards[index].updated_at = new Date(data.updated_at).toLocaleString();
          }
          return list;
        });
        commit("setLists", modified_lists);
        const success = document.getElementById("general-success");
        success.innerHTML = "Card Marked Successfully";
        setTimeout(() => { success.innerHTML = ""; }, 5000);
      }
      if (response.status == 400) {
        const error = document.getElementById("general-error");
        error.innerHTML = data.message;
        setTimeout(() => { error.innerHTML = ""; }, 5000);
      }
    },
    async unmarkCard({ commit }, { card_id, list_id }) {
      const response = await fetch("/api/v1/card/notcomplete/"+ card_id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.state.access_token}`,
        },
      });
      const data = await response.json();
      if (response.status == 200) {
        const modified_lists = store.state.lists.map((list) => {
          const index = list.cards.findIndex((card) => card.id == card_id);
          if (index != -1) {
            list.cards[index].status = "Not Completed";
          }
          return list;
        });
        commit("setLists", modified_lists);
        const success = document.getElementById("general-success");
        success.innerHTML = "Card Unmarked Successfully";
        setTimeout(() => { success.innerHTML = ""; }, 5000);
      }
      if (response.status == 400) {
        const error = document.getElementById("general-error");
        error.innerHTML = data.message;
        setTimeout(() => { error.innerHTML = ""; }, 5000);
      }
    }
  },
  getters: {
    lists(state) {
      return state.lists;
    },
    if_auth (state) {
      if (state.access_token) {
        const checkAccess = store.dispatch("checkAccessToken");
      }
      return state.access_token != null;
    }
  },
});

const login = Vue.component('login', {
  template: `
    <div>
      <section class="h-100">
        <div class="container h-100">
          <div class="row justify-content-sm-center h-100">
            <div class="col-xxl-4 col-xl-5 col-lg-5 col-md-7 col-sm-9">
              <div class="text-center my-5">
                <br><br><br>
              </div>
              <div class="card shadow-lg">
                <div class="card-body p-5">
                  <h1 class="fs-4 card-title fw-bold mb-4">Login</h1>
                  <form>
                    <div class="mb-3">
                      <label for="username" class="form-label">Username</label>
                      <input type="text" class="form-control" id="username" v-model="username">
                    </div>
                    <div class="mb-3">

                      <label for="password" class="form-label">Password</label>
                      <input type="password" class="form-control" id="password" v-model="password">
                    </div>
                    <button type="submit" class="btn btn-primary" @click.prevent="login">Submit</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  data() {
      return {
          username: '',
          password: ''
      }
  },
  methods: {
      login() {
          store.dispatch('login', {
              username: this.username,
              password: this.password
          })
          router.push('/')
      }
  }
})

const signup = Vue.component('signup', {
  template: `
    <div>
      <section class="h-100">
        <div class="container h-100">
          <div class="row justify-content-sm-center h-100">
            <div class="col-xxl-4 col-xl-5 col-lg-5 col-md-7 col-sm-9">
              <div class="text-center my-5">
                <br><br><br>
              </div>
              <div class="card shadow-lg">
                <div class="card-body p-5">
                  <h1 class="fs-4 card-title fw-bold mb-4">Signup</h1>
                  <form>
                    <div class="mb-3">
                      <label for="username" class="form-label">Username</label>
                      <input type="text" class="form-control" id="username" v-model="username">
                    </div>
                    <div class="mb-3">
                      <label for="email" class="form-label">Email</label>
                      <input type="email" class="form-control" id="email" v-model="email">
                    </div>
                    <div class="mb-3">
                      <label for="password" class="form-label">Password</label>
                      <input type="password" class="form-control" id="password" v-model="password">
                    </div>
                    <button type="submit" class="btn btn-primary" @click.prevent="signup">Submit</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  data() {
      return {
          username: '',
          email: '',
          password: ''
      }
  },
  methods: {
      signup: function() {
          store.dispatch('signup', {
              username: this.username,
              email: this.email,
              password: this.password
          })
      }
  }
})

const logout = Vue.component('logout', {
  template: `<div></div>`,
  methods: {
      logout: function() {
          store.dispatch('logout')
      }
  },
  mounted() {
    this.logout();
    router.push('/');
  }
})

const board = Vue.component('board', {
  template: `
  <div>         
    <div class="row justify-content-sm-center" style="margin-top: 1%;"> 
      <span id="general-error" class="text-danger"></span>
      <span id="general-success" class="text-success"></span>
      <div class="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-8" style="margin: 0.5%;" v-for="list in lists">
        <div class="card shadow-lg">
          <div class="card-body" style = "background-color: #f8f9fa; padding-top : 4%; padding-bottom : 4%;" >
            <span :id = "'list-name-' + list.id" class="fs-4 card-title fw-bold" style = "text-align: center; text-size: 10px;">{{ list.name }}</span>
            <button :id = "'list-name-delete-' + list.id" @click.prevent="deleteList(list.id)" class="btn btn-outline-secondary disable-edit-list" type="button" style="float: right; margin-top: -2%; margin-right: -1%;"><i class="fa-regular fa-trash-alt"></i></button>
            <button :id = "'list-name-edit-' + list.id" @click.prevent="showEditList(list.id, list.name)" class="btn btn-outline-secondary disable-edit-list" type="button" style="float: right; margin-top: -2%; margin-right: 1%;"><i class="fa-regular fa-pen-to-square"></i></button>
          </div>
          <div class="input-group" :id = "'list-name-input-' + list.id" style="display: none;">
              <form>
                <input type="text" class="form-control" :id = "'list-name-input-field-' + list.id" placeholder="List Name" v-model="list_name">
                <button class="btn btn-outline-secondary" type="button" @click.prevent="editList(list.id)">Edit</button>
              </form>
          </div>
          <div class="card-body p-3">
            <ul class="list-group list-group-flush">
              <li class="list-group list-group-flush" v-for="card in list.cards">
              <div class = "p-4 m-3 card shadow-lg">
              <span id = "card-error" class="text-danger"></span>
              <span id = "card-success" class="text-success"></span>
                <div :id="'card-body-'+card.id" class="card-body" style = "background-color: #f8f9fa; padding-top : 4%; padding-bottom : 4%;">
                  <button :id="'card-name-edit-' + card.id" v-if = "card.status == 'Not Completed'" @click.prevent="showEditCard(card.id, card.name, card.description, card.deadline, list.id)" class="btn btn-outline-secondary disable-edit-card" type="button" style="float: right; margin-top: -2%; margin-right: -1%;"><i class="fa-regular fa-pen-to-square"></i></button>
                  <span :id="'card-name-' + card.id" class="fs-4 card-title fw-bold">{{ card.name }}</span>
                  
                  <p class="card-text">{{ card.description }}</p>
                  <p class="card-text">Deadline: {{ card.deadline }}</p>
                  <p class="card-text" v-if = "card.status == 'Not Completed'">Not Completed</p>
                  <p class="card-text" v-if = "card.status == 'Completed'">Completed on {{ card.updated_at }}</p>
                  <br>
                </div>
                <div :id="'card-body-input-'+card.id" class="input-group" style="display: none;">
                  <form> 
                    <div class="mb-3">
                      <label for="card-name" class="form-label">Card Name</label>
                      <input type="text" class="form-control" id="card-name" v-model="cardName">
                    </div>
                    <div class="mb-3">
                      <label for="card-description" class="form-label">Card Description</label>
                      <input type="text" class="form-control" id="card-description" v-model="cardDescription">
                    </div>
                    <div class="mb-3">
                      <label for="card-deadline" class="form-label ">Card Deadline</label>
                      <input type="datetime-local" class="form-control" v-model="cardDeadline">
                    </div>
                    <div class="mb-3">
                      <label for="card-list" class="form-label">Move Card</label>
                      <select class="form-select" aria-label="Default select example" :id="'card-list-input-field-' + card.id" v-model="cardList">
                        <option v-for="list in lists" :value="list.id">{{ list.name }}</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <button class="btn btn-outline-secondary" type="button" @click.prevent="editCard(card.id, list.id, card.description, card.deadline, card.name)">Edit</button>
                      <button class="btn btn-outline-secondary" type="button" @click.prevent="cancelEditCard(card.id)">Cancel</button>
                    </div>
                  </form>
                </div>
                <div class="card-footer">
                <button :id="'mark-as-done-btn' + card.id" 
                class="btn btn-success" @click.prevent="markAsDone(card.id, list.id)" v-if = "card.status == 'Not Completed'">Mark as Done</button>
                <button :id="'mark-as-undone-btn' + card.id"
                class="btn btn-warning" @click.prevent="markAsUndone(card.id, list.id)" v-if = "card.status == 'Completed'">Mark as Undone</button>
                <button class="btn btn-danger" @click.prevent="deleteCard(card.id, list.id)">Delete</button>
                </div>
              </div>
              </li>
            </ul>
          </div>
          <div class="card-footer">
              <button class="btn btn-primary disable-add-card" :id = "'add-card-button-' + list.id" @click="showAddCard(list.id)">Add Card</button>
              <div :id = "'add-card-content-' + list.id" style="display: none;">
                <form>
                  <div class="mb-3">
                    <label for="card-name" class="form-label">Card Name</label>
                    <input type="text" class="form-control" id="card-name" v-model="cardName">
                  </div>
                  <div class="mb-3">
                    <label for="card-description" class="form-label">Card Description</label>
                    <input type="textarea" class="form-control" id="card-description" v-model="cardDescription" style = "height: 100px;">
                  </div>
                  <div class="mb-3">
                    <label for="card-deadline" class="form-label">Deadline</label>
                    <input type="datetime-local" class="form-control" id="card-deadline" v-model="cardDeadline">
                  </div>
                  <button type="submit" class="btn btn-primary" @click.prevent="addCard(list.id)">Submit</button>
                  <button type="submit" class="btn btn-primary" @click.prevent="hideAddCard(list.id)">Cancel</button>
                </form>
              </div>
            </div>
        </div>
      </div>
        <div class="col-xxl-3 col-xl-4 col-lg-4 col-md-6 col-sm-8" style="margin: 1%;">
          <div class="text-center my-3">
            <div class="card shadow-lg">
              <div class="card-body p-5">
                <button id = "add-list-button" class="btn btn-primary" 
                onclick="document.getElementById('add-list-content').style.display = 'block';
                document.getElementById('add-list-button').style.display = 'none';
                ">
                Add List</button>
                <div id = "add-list-content" style="display: none;">
                  <h1 class="fs-4 card-title fw-bold mb-4">Add List</h1>
                  <form>
                    <div class="mb-3">
                      <label for="list_name" class="form-label">List Name</label>
                      <input type="text" class="form-control" id="list_name" v-model="list_name">
                    </div>
                    <button type="submit" class="btn btn-primary" @click.prevent="add_list">Add</button>
                    <button id = "cancel-add-list-button" class="btn btn-primary"
                    onclick="document.getElementById('add-list-content').style.display = 'none';
                    document.getElementById('add-list-button').style.display = 'inline';
                    ">Cancel</button>
                  </form>
                  <span id="list-add-error" style="color: red;"></span>
                </div>
                <span id="list-add-success" style="color: green;"></span>
              </div>  
            </div>
          </div>
        </div>
    </div>  
  </div>
  `,
  data() {
    return {
      list_name: '',
      cardName: '',
      cardDescription: '',
      cardDeadline: '',
      cardList: '',
    }
  },
  computed: {
    lists() {
      return store.getters.lists;
    },
  },
  methods: {
    add_list: function() {
      store.dispatch('createList', {
        list_name: this.list_name,
      })
      list_name = '';
    },
    showEditList: function(id, name) {
      document.getElementById('list-name-edit-' + id).style.display = 'none';
      document.getElementById('list-name-input-' + id).style.display = 'block';
      document.getElementById('list-name-' + id).style.display = 'none';
      this.list_name = name;

      const disableLists = document.getElementsByClassName('disable-edit-list');
      for (let i = 0; i < disableLists.length; i++) {
        disableLists[i].style.display = 'none';
      }
    },
    editList: function(id) {
      store.dispatch('editList', {
        list_id: id,
        list_name: this.list_name,
      })
      this.list_name = '';
      document.getElementById('list-name-input-' + id).style.display = 'none';
      document.getElementById('list-name-' + id).style.display = 'inline';
      document.getElementById('list-name-edit-' + id).style.display = 'flex';
      document.getElementById('list-name-edit-' + id).style.float = 'right';
      document.getElementById('list-name-edit-' + id).style.marginTop = '-2%';
      document.getElementById('list-name-edit-' + id).style.marginRight = '1%';
      const disableLists = document.getElementsByClassName('disable-edit-list');
      for (let i = 0; i < disableLists.length; i++) {
        disableLists[i].style.display = 'block';
      }
    },
    deleteList: function(id) {
      store.dispatch('deleteList', {
        list_id: id,
      })
    },
    showAddCard: function(id) {
      document.getElementById('add-card-content-' + id).style.display = 'block';
      document.getElementById('add-card-button-' + id).style.display = 'none';
      const disableCards = document.getElementsByClassName('disable-add-card');
      for (let i = 0; i < disableCards.length; i++) {
        disableCards[i].style.display = 'none';
      }
    },
    addCard: function(id) {
      store.dispatch('createCard', {
        list_id: id,
        card_name: this.cardName,
        card_description: this.cardDescription,
        deadline: this.cardDeadline,
      })
      this.cardName = '';
      this.cardDescription = '';
      this.cardDeadline = '';
      const disableCards = document.getElementsByClassName('disable-add-card');
      for (let i = 0; i < disableCards.length; i++) {
        disableCards[i].style.display = 'block';
      }
    },
    hideAddCard: function(id) {
      document.getElementById('add-card-content-' + id).style.display = 'none';
      document.getElementById('add-card-button-' + id).style.display = 'block';
      this.cardName = '';
      this.cardDescription = '';
      this.cardDeadline = '';
      const disableCards = document.getElementsByClassName('disable-add-card');
      for (let i = 0; i < disableCards.length; i++) {
        disableCards[i].style.display = 'block';
      }
    },
    showEditCard: function(id, name, description, deadline, list_id) {
      document.getElementById('card-body-' + id).style.display = 'none';
      document.getElementById('card-body-input-' + id).style.display = 'block';
      const disableCards = document.getElementsByClassName('disable-edit-card');
      for (let i = 0; i < disableCards.length; i++) {
        disableCards[i].style.display = 'none';
      }
      // convert deadline to Date format. Currently data is in locale format
      var new_deadline = new Date()
      // deadline_format = "20/1/2023, 10:30:00 am"
      new_deadline.setFullYear(deadline.split(",")[0].split("/")[2]);
      new_deadline.setMonth(deadline.split(",")[0].split("/")[1] - 1);
      new_deadline.setDate(deadline.split(",")[0].split("/")[0]);
      new_deadline.setHours(deadline.split(",")[1].split(":")[0]);
      new_deadline.setMinutes(deadline.split(",")[1].split(":")[1]);
      new_deadline.setSeconds(deadline.split(",")[1].split(":")[2].split(" ")[0]);
      if (deadline.split(",")[1].split(":")[2].split(" ")[1] == "pm") {
        new_deadline.setHours(new_deadline.getHours() + 12);
      }
      console.log(new_deadline);
      this.cardName = name;
      this.cardDescription = description;
      this.cardDeadline = new_deadline;
      this.cardList = list_id;
    },
    editCard: function(id, list_id, description, deadline, name) {
      if (name != this.cardName || description != this.cardDescription || deadline != this.cardDeadline) {
        store.dispatch('editCard', {
          card_id: id,
          card_name: this.cardName,
          card_description: this.cardDescription,
          deadline: this.cardDeadline,
        })
      }
      if (this.cardList != list_id) {
        store.dispatch('moveCard', {
          card_id: id,
          list_id: list_id,
          new_list_id: this.cardList,
        })
      }
      this.cardName = '';
      this.cardDescription = '';
      this.cardDeadline = '';
      this.cardList = '';
      document.getElementById('card-body-' + id).style.display = 'block';
      document.getElementById('card-body-input-' + id).style.display = 'none';
      const disableCards = document.getElementsByClassName('disable-edit-card');
      for (let i = 0; i < disableCards.length; i++) {
        disableCards[i].style.display = 'block';
      }
    },
    cancelEditCard: function(id) {
      this.cardName = '';
      this.cardDescription = '';
      this.cardDeadline = '';
      this.cardList = '';
      document.getElementById('card-body-' + id).style.display = 'block';
      document.getElementById('card-body-input-' + id).style.display = 'none';
      const disableCards = document.getElementsByClassName('disable-edit-card');
      for (let i = 0; i < disableCards.length; i++) {
        disableCards[i].style.display = 'block';
      }
    },
    deleteCard: function(id, list_id) {
      store.dispatch('deleteCard', {
        card_id: id,
        list_id: list_id,
      })
    },
    markAsDone: function(id, list_id) {
      store.dispatch('markCard', {
        card_id: id,
        list_id: list_id,
      })
    },
    markAsUndone: function(id, list_id) {
      store.dispatch('unmarkCard', {
        card_id: id,
        list_id: list_id,
      })
    },
  },
  mounted() {
    if (!store.getters.if_auth) {
      router.push('/login');
      return;
    }
    store.dispatch('loadLists');
  }
})

const dashboard = Vue.component('dashboard', {
  template: `
    `,
})

const routes = [
  { path: '/login', component: login },
  { path: '/signup', component: signup },
  { path: '/logout', component: logout },
  { path: '/', component: dashboard },
  { path: '/board', component: board },
] 

const router = new VueRouter({
  routes
});

new Vue({
  el: "#app",
  router: router,
  store: store,
  data: {
    message: "Hello Vue!",
  },
  computed : {
    auth () {
      return store.getters.if_auth
    }
  },
});
