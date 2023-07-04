import userModel from "../models/userModel.js"
import { comparePassword, hashPassword } from "../helpers/authHelpers.js"
import JWT from "jsonwebtoken"
import orderModel from "../models/orderModel.js"
export const registerController = async(req, res) => {
    try {
        const {name, email, password, phone, address, answer, role} = req.body
        if(!name){
            return res.send({message: "Name is required"})
        }
        if(!email){
            return res.send({message: "email is required"})
        }
        if(!password || password.length < 8){
            return res.send({message: "password is required and minimum 8 characters"})
        }
        if(!phone){
            return res.send({message: "phone is required"})
        }
        if(!address){
            return res.send({message: "address is required"})
        }
        if(!answer){
            return res.send({message: "address is required"})
        }

        const existingUser = await userModel.findOne({email});

        if(existingUser){
            return res.status(200).send({
                success: false,
                message: 'User with this email already registered',

            })
        }

        const hashedPassword = await hashPassword(password)

        const user = new userModel({name, email, phone, address, password:hashedPassword, answer, role}).save();
        res.status(201).send({
            success: true,
            message: "User Registered Successfully",
            user,
        })
    } catch (error) {
        console.log(error)
            return res.status(500).send({
                success: false, 
                message: 'Error in Registration',
                error
            })        
    }
}

export const loginController = async (req, res) => {
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).send({
                success: false,
                message:'Invalid email or password'
            })
        }
        const user = await userModel.findOne({email});
        if(!user){ 
            return res.status(400).send({
                success: false,
                message: 'Email not registered'
            })
        }
        const match = await comparePassword(password, user.password)
        if(!match){
            return res.status(200).send({
                success: false,
                message: "Invalid Password"
            })
        }

        const token = JWT.sign({_id: user.id}, process.env.JWT_SECRET, {expiresIn:'7d'});
        res.status(200).send({
            success: true,
            message: 'loggedin successfully',
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role
            },
            token, 
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Error in login',
            error
        })
    }
}

export const testController = (req, res) => {
    try {
        res.send('Protected Route')
    } catch (error) {
        console.log(error);
    }
}

export const forgotPasswordController = async(req, res)=>{
    try { 
        const {email, answer, newPassword} = req.body  
        if(!email){
            res.status(400).send({message:"Email is required"});
        }
        if(!answer){
            res.status(400).send({message:"Answer is required"});
        }
        if(!newPassword){
            res.status(400).send({message:"Password is required"});
        }

        const user = await userModel.findOne({email, answer})

        if(!user){
            return res.status(404).send({
                success: false,
                message: 'Wrong email or answer'
            })
        }

        const hashed = await hashPassword(newPassword)
        await userModel.findByIdAndUpdate(user._id, {password: hashed})
        res.status(200).send({
            success: true,
            message: "Password Reset Successfully"
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: 'Something went wrong',
            error
        })
    }
}

export const updateProfileController = async(req, res)=>{
    try {
        const {name, email, password, phone, address } = req.body
        const user = await userModel.findById(req.user._id);
        if(password && password.length < 4){
            return res.json({error: "password is required and atleast 4 characters long"}) // res.json took a alot of time
        }
        const hashedPassword = password ? await hashPassword(password) : undefined       
        const updatedUser = await userModel.findByIdAndUpdate(req.user._id, {
            name: name || user.name,
            password: hashedPassword || user.password,
            phone: phone || user.phone,
            address: address || user.address
        }, {new: true});
        res.status(200).send({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser,
        })
    } catch (error) {
        console.log(error)
            res.status(500).send({
                success: false, 
                message: 'Error while Updating Profile',
                error
            })        
    }
}

export const getOrdersController = async(req, res)=>{
    try {
        const orders = await orderModel.find({buyer: req.user._id}).populate('products','-photo').populate("buyer","name")
        res.json(orders); 
    } catch (error) {
        console.log(error)
            res.status(500).send({
                success: false, 
                message: 'Error getting orders',
                error
            })        
    }
}

export const getAllOrdersController = async(req, res)=>{
    try {
        const orders = await orderModel.find({}).populate('products','-photo').populate("buyer","name").sort({createdtAt: '-1'})
        res.json(orders); 
    } catch (error) {
        console.log(error)
            res.status(500).send({
                success: false, 
                message: 'Error getting orders',
                error
            })        
    }
}

export const orderStatusController = async(req, res)=>{
    try {
        const {orderId } = req.params  
        const {status } = req.body
        const orders = await orderModel.findByIdAndUpdate(orderId, {status}, {new:true})  
    } catch (error) {
        console.log(error)
            res.status(500).send({
                success: false, 
                message: 'Error getting orders',
                error
            })        
    }
}


export const getAllUsersController = async(req, res)=>{
    try {
        const users = await userModel.find({})
        res.json(users); 
    } catch (error) {
        console.log(error)
            res.status(500).send({
                success: false, 
                message: 'Error getting users',
                error
            })        
    }
}