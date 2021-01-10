const express = require("express");
const passport = require("passport");
const methodOverride = require("method-override");
const shortid = require("shortid");
const bcrypt = require("bcrypt");
const morgan = require("morgan");

const User = require("../models/user");

const { resetEmail } = require("../emails/account");
const { auth, notauth, adminAuth } = require("../middleware/auth");
const Payment = require("../models/payment");

const router = express.Router();

router.use(methodOverride("_method"));

router.get("/reset/:token", notauth, async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    return res.render("verification", {
      message: "INVALID ATTEMPT",
    });
  } else {
    res.render("forgot", {
      user,
      csrfToken: req.csrfToken(),
    });
  }
});

// router.get("/users", auth, async (req, res) => {
//   try {
//     user = req.user;
//     if (user.isAdmin === true) {
//       const userList = await User.find({}).sort({ name: 1 });

//       res.render("verification", {
//         user,
//         userList,
//         pageTitle: "Users",
//       });
//     } else {
//       res.redirect("/admin/blog");
//     }
//   } catch (e) {
//     console.log(e);
//     res.render("verification", {
//       message: "Something Went Wrong",
//       user,
//     });
//   }
// });

router.get("/user/me", auth, async (req, res) => {
  res.redirect("/invoice/generate");
});

router.get("/signup", notauth, async (req, res) => {
  res.render("signup", {
    csrfToken: req.csrfToken(),
    info: req.flash("info"),
  });
});

router.get("/login", notauth, (req, res) => {
  try {
    const message = req.flash("error")[0];
    res.render("login", {
      csrfToken: req.csrfToken(),
      message,
    });
  } catch (e) {
    console.log(e);
    res.send("something went wrong");
  }
});

router.get("/verification/:token", async (req, res) => {
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    return res.render("verification", {
      message: "INVALID ATTEMPT",
    });
  } else {
    user.token = undefined;
    user.isVerified = true;

    await user.save();
    res.render("verification", {
      message: "Verified",
      login: "/login",
    });
  }
});

router.get("/logout", auth, (req, res) => {
  req.session.destroy();
  req.logOut();
  res.redirect("/login");
});

// router.post("/signup", async (req, res) => {
//   try {
//     const userCount = await User.countDocuments();
//     const user = new User(req.body);

//     if (userCount === 0) {
//       user.isAdmin = true;
//     } else {
//       user.isAdmin = undefined;
//     }
//     user.isVerified = true;
//     await user.save();

//     res.render("signup", {
//       info: "User Added",
//       csrfToken: req.csrfToken(),
//     });
//   } catch (e) {
//     console.log(e);
//     if (e.code === 11000) {
//       req.flash("info", "Email Already Associated With Another Account");
//       return res.redirect(`/signup`);
//     }
//     req.flash("info", "Something Went Wrong");
//     res.redirect(`/signup`);
//   }
// });

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (req, res) => {
    if (req.session.oldUrl) {
      const oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(oldUrl);
    } else if (req.user.isAdmin) {
      res.redirect("/admin/dashboard");
    } else {
      res.redirect("/user/me");
    }
  }
);

router.get("/admin/dashboard", adminAuth, async (req, res) => {
  try {
    // const payments = await Payment.aggregate([
    //   {
    //     $lookup: {
    //       from: "user",
    //       localField: "paidBy",
    //       foreignField: "_id",
    //       as: "user",
    //     },
    //   },
    // ]);

    let paymentsArray = await Payment.find({}).limit(10).sort({ _id: -1 });
    let payments = [];
    for (let payment of paymentsArray) {
      const user = await User.findOne({ _id: payment.paidBy });
      payment.paidBy = user;
      payments.push(payment);
    }
    console.log(payments);
    res.render("dashboard", {
      payments,
    });
  } catch (e) {
    console.log(e);
  }
});

router.post("/user/forgot", notauth, async (req, res) => {
  try {
    console.log("here");
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      req.flash("message", `No User Associated With ${req.body.email}`);
      req.session.save();
      res.redirect("/user/forgot");
    } else {
      const token = shortid.generate();
      await User.findByIdAndUpdate({ _id: user._id }, { token });
      resetEmail(user.email, user.schoolName, token);
      res.render("verification", {
        pageTitle: "Forgot Password",
        message: "Please Check Your E-mail For Further Details",
      });
    }
  } catch (e) {
    console.log(e);
    req.flash("info", "Something Went Wrong");
    res.redirect("/user/forgot");
  }
});

router.get("/user/forgot", notauth, async (req, res) => {
  const message = req.flash("message");
  console.log(message);
  res.render("login", {
    csrfToken: req.csrfToken(),
    message: message[0],
  });
});

router.post("/user/password", auth, async (req, res) => {
  const user = req.user;
  const userData = await User.findById({ _id: user._id });
  if (
    (await bcrypt.compare(req.body.currentPassword, userData.password)) ===
    false
  ) {
    req.flash("info", "Current Password Doesn't Match");
    return res.render("my-account", {
      pageTitle: "Change Password",
      user,
    });
  }
  userData.password = req.body.password;
  await userData.save();
  res.render("my-account", {
    pageTitle: "Password Changed",
    user,
    message: "Password Changed Successfully",
  });
});

router.patch("/user/edit", auth, async (req, res) => {
  try {
    const user = req.user;
    if (user.email != req.body.email) {
      var token = shortid.generate();
      await User.findByIdAndUpdate(
        { _id: user._id },
        {
          name: req.body.name,
          email: req.body.email,
          isVerified: false,
          token,
        }
      );

      var subjectEmail = "Verify Your New E-Mail";
      var messageEmail = "Updated Your E-mail";

      verifyEmail(
        req.body.email,
        subjectEmail,
        req.body.name,
        messageEmail,
        token
      );

      return res.render("verification", {
        pageTitle: "Updated",
        message:
          "Profile Updated Successfully, Make Sure To Verify Your New Email Within 24 Hours Otherwise Your Account Will Be Deleted",
        user,
      });
    }
    await User.findByIdAndUpdate(
      { _id: user._id },
      {
        name: req.body.name,
        email: req.body.email,
      }
    );
    res.render("verification", {
      pageTitle: "Updated",
      message: "Profile Updated Successfully",
      user,
    });
  } catch (e) {
    console.log(e);
    if (e.code === 11000) {
      req.flash("info", "Email Already Associated With Another Account");
      return res.redirect("/user/me");
    }
    req.flash("info", "Something Went Wrong");
    res.redirect("/user/me");
  }
});

router.post("/user/reset", notauth, async (req, res) => {
  try {
    const user = await User.findOne({ token: req.body.token });
    user.password = req.body.password;
    user.token = undefined;
    await user.save();

    res.render("verification", {
      pageTitle: "Password Changed",
      message: "Password Changed Successfully",
      login: "/login",
    });
  } catch (e) {
    console.log(e);
    req.flash("info", "Something Went Wrong");
    res.render("verification");
  }
});

module.exports = router;
