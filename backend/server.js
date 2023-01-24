import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/final-project";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex")
  }
});

const User = mongoose.model("User", UserSchema);

const CharacterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  backstory: {
    type: String
  },
  profession: {
    type: String,
    required: true
  },
  race: {
    type: String,
    required: true,
  },
  strength: {
    type: String,
    required: true
  },
  dexterity: {
    type: String,
    required: true
  },
  constitution: {
    type: String,
    required: true
  },
  intelligence: {
    type: String,
    required: true
  },
  wisdom: {
    type: String,
    required: true
  },
  charisma: {
    type: String,
    required: true
  },
});

const Character = mongoose.model("Character", CharacterSchema);

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello Player!");
});

app.post("/register", async (req, res) => {
  const { username, password, nickname } = req.body;
  const checkUsername = await User.findOne({username})
  const checkNickname = await User.findOne({nickname})
  if (!checkUsername && !checkNickname){
  try {
    const salt = bcrypt.genSaltSync();
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        response: "Password must be at least 8 characters long"
      });
    } else {
      const newUser = await new User({username: username, nickname: nickname, password: bcrypt.hashSync(password, salt)}).save();
      res.status(201).json({
        success: true,
        response: {
          username: newUser.username,
          accessToken: newUser.accessToken,
          nickname: newUser.nickname,
          id: newUser._id
        }
      });
    }
  } catch(error) {
      res.status(400).json({
        success: false,
        response: error
      });
  }
} else {
  res.status(400).json({
    success: false,
    response: "This username and nickname is taken."
  })
}
});
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({username});
    if(user && bcrypt.compareSync(password, user.password)) {
      res.status(200).json({
        success: true,
        response: {
          nickname: user.nickname,
          id: user._id,
          accessToken: user.accessToken
        }
      });
    } else {
      res.status(400).json({
        success: false,
        response: "Credentials didn't match"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      response: error
    });
  }
});

app.post("/new-character", async (req,res) => {
  const { name, backstory, race, strength, dexterity, constitution, intelligence, wisdom, charisma, profession } = req.body;
    try{
      const newCharacter = await new Character({name: name, race: race, backstory: backstory, strength: strength, dexterity: dexterity, constitution: constitution, intelligence: intelligence, wisdom: wisdom, charisma: charisma, profession: profession}).save()
      res.status(201).json({response: {
        name:  newCharacter.name,
        backstory: newCharacter.backstory,
        race: newCharacter.race,
        strength: newCharacter.strength,
        dexterity: newCharacter.dexterity,
        constitution: newCharacter.constitution,
        intelligence: newCharacter.intelligence,
        wisdom: newCharacter.wisdom,
        charisma: newCharacter.charisma,
        profession: newCharacter.profession
    }})  
    
    } catch(error) {
    res.status(400).json({
      success: false,
      response: "Invalid character"
    });
    }
})

app.get("/character-list", async (req,res) => {

    try {
    const characterList = await Character.find().limit(20).exec();
    res.status(201).json({
      characterList
    });
    } catch (error) {
      res.status(400).json({
        success: false,
        response: error
      })}
})

const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({accessToken: accessToken});
    if (user) {
      next();
    } else {
      res.status(401).json({
        response: "Please log in",
        success: false
      })
    }
  } catch (error) {
    res.status(400).json({
      response: error,
      success: false
    })
  }
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});