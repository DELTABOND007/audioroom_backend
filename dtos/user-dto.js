class UserDto {
    id;
    phone;
    email;
     name;
     photo;
    activated;
    createdAt;

    constructor(user) {
        this.id = user._id;
        this.phone = user.phone;
        this.email = user.email;
        this.name = user.name;
        this.photo = user.photo ? user.photo : null;
        this.activated = user.activated;
        this.createdAt = user.createdAt;
    }
}

module.exports = UserDto;