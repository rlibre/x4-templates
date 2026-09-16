import { Application, Component } from "x4js";
import "./main.scss";

class MainView extends Component {
    constructor() {
        super({ cls: "main-view" });

        this.setContent("Hello x4");
    }
}

class App extends Application {
    constructor() {
        super({});

        this.setMainView(new MainView());
    }
}

new App();