import requests 

user = requests.post(
    'http://localhost:5000/login',
    json = {
            "email": "akhil@.com",
            "password": "akhil12345"
        }
)
print(user.text)

cards = requests.get(
    'http://localhost:5000/api/v1/list/allLists',
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.json()['access_token']
    }
)
print(cards.text)

<router-link class="nav-link" to="/login" v-if = "!auth">Login</router-link>
                        <router-link class="nav-link" to="/register" v-if = "!auth">Register</router-link>
                        <router-link class="nav-link" to="/logout" v-if = "auth">Logout</router-link>