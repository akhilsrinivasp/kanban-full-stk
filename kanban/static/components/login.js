export const login = Vue.component('login', {
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
          // re calculate computed in app in vue2
          // this.$root.$forceUpdate()
          router.push('/')
      }
  }
})